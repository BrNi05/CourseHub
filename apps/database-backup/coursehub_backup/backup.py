"""
Backup client module.

Implements a backup system that downloads database exports from a remote endpoint,
supports retries, authentication handling, local locking, and retention-based cleanup.
"""

from __future__ import annotations

from collections.abc import Callable
from contextlib import contextmanager
from dataclasses import dataclass
from datetime import datetime
import logging
import os
from pathlib import Path
import time

import httpx  # pylint: disable=import-error

from .config import ConfigStore, ServiceConfig
from .paths import ServicePaths, ensure_runtime_dirs
from .scheduler import local_now
from .state import StateStore


class BackupError(Exception):
    """Base exception for backup failures."""


class ConfigurationError(BackupError):
    """Raised when local configuration is missing or invalid."""


class AuthenticationError(BackupError):
    """Raised when the remote endpoint rejects the configured cookie."""


class AlreadyRunningError(BackupError):
    """Raised when another backup process still owns the local lock."""


class RetryableBackupError(BackupError):
    """Raised for transient failures (e.g. HTTP 5xx) that should be retried."""


@dataclass
class BackupResult:
    """
    Represents the result of a successful backup operation.
    """
    file_path: Path
    bytes_written: int
    completed_at: datetime
    attempts: int


class BackupClient:
    """
    Main client responsible for performing backup operations.
    """

    def __init__(
        self,
        paths: ServicePaths,
        config_store: ConfigStore,
        state_store: StateStore,
        logger: logging.Logger,
        client_factory: Callable[[ServiceConfig], httpx.Client] | None = None,
        sleeper: Callable[[float], None] | None = None,
    ):
        """
        Initializes the backup client with required dependencies.

        Args:
            paths: Runtime path configuration.
            config_store: Configuration persistence layer.
            state_store: Backup state tracking storage.
            logger: Logger instance.
            client_factory: Optional factory for HTTP client (testability).
            sleeper: Optional sleep function (testability).
        """
        self.paths = paths
        self.config_store = config_store
        self.state_store = state_store
        self.logger = logger
        self.client_factory = client_factory or self._build_http_client
        self.sleeper = sleeper or time.sleep

    def run_now(self, reason: str) -> BackupResult:
        """
        Executes a backup immediately, handling retries and state recording.

        Args:
            reason: Human-readable reason for triggering the backup.

        Returns:
            BackupResult on success.

        Raises:
            BackupError: If the operation ultimately fails.
        """
        config = self.config_store.load()
        if not config.cookie_value:
            raise ConfigurationError("Cookie is not configured. Use `set-cookie` first.")

        ensure_runtime_dirs(self.paths)

        self.state_store.record_attempt(local_now(), reason)

        with self._run_lock():
            last_error: BackupError | None = None

            for attempt in range(1, config.max_retries + 1):
                try:
                    result = self._download_once(config, attempt, reason)

                    self.state_store.record_success(
                        result.completed_at,
                        result.file_path.name,
                        result.bytes_written,
                        reason,
                    )

                    self.logger.info(
                        "Backup completed: %s (%s bytes, reason=%s, attempt=%s)",
                        result.file_path.name,
                        result.bytes_written,
                        reason,
                        attempt,
                    )

                    self._cleanup_old_backups(
                        config.retention_days,
                        keep_file=result.file_path,
                    )
                    return result

                except (AuthenticationError, ConfigurationError, AlreadyRunningError) as error:
                    self.state_store.record_failure(local_now(), str(error), reason)
                    self.logger.error("Backup failed: %s", error)
                    raise

                except RetryableBackupError as error:
                    last_error = error
                    if attempt >= config.max_retries:
                        break

                    delay_seconds = 10
                    self.logger.warning(
                        "Retryable failure %s/%s: %s. Retrying in %ss.",
                        attempt,
                        config.max_retries,
                        error,
                        delay_seconds,
                    )
                    self.sleeper(delay_seconds)

                except BackupError as error:
                    last_error = error
                    break

        completed_at = local_now()
        message = str(last_error or BackupError("Backup failed for an unknown reason."))

        self.state_store.record_failure(completed_at, message, reason)
        self.logger.error("Backup failed: %s", message)

        raise type(last_error or BackupError(message))(message)

    def _download_once(self, config: ServiceConfig, attempt: int, reason: str) -> BackupResult:
        """
        Performs a single backup download attempt.

        Returns:
            BackupResult on success.

        Raises:
            BackupError subclasses on failure.
        """
        completed_at: datetime | None = None
        temp_path: Path | None = None

        try:
            with self.client_factory(config) as client:
                with client.stream(
                    "GET",
                    config.endpoint,
                    headers={"Cookie": f"{config.cookie_name}={config.cookie_value}"},
                ) as response:

                    if response.status_code in {401, 403}:
                        raise AuthenticationError(
                            f"Endpoint rejected cookie (HTTP {response.status_code})."
                        )

                    if response.status_code >= 500:
                        raise RetryableBackupError(
                            f"Server error HTTP {response.status_code}."
                        )

                    if response.status_code >= 400:
                        raise BackupError(
                            f"Client error HTTP {response.status_code}."
                        )

                    target_path = self._build_target_path()
                    temp_path = target_path.with_suffix(f"{target_path.suffix}.part")

                    if temp_path.exists():
                        temp_path.unlink()

                    bytes_written = 0
                    with temp_path.open("wb") as handle:
                        for chunk in response.iter_bytes():
                            if not chunk:
                                continue
                            handle.write(chunk)
                            bytes_written += len(chunk)

                    if bytes_written <= 0:
                        raise BackupError("Downloaded backup was empty.")

                    temp_path.replace(target_path)
                    completed_at = local_now()

                    return BackupResult(
                        file_path=target_path,
                        bytes_written=bytes_written,
                        completed_at=completed_at,
                        attempts=attempt,
                    )

        except (AuthenticationError, ConfigurationError, AlreadyRunningError, BackupError):
            raise

        except (httpx.TimeoutException, httpx.NetworkError) as error:
            raise RetryableBackupError(
                f"Network failure during download: {error}"
            ) from error

        except httpx.HTTPError as error:
            raise BackupError(
                f"HTTP client failure during download: {error}"
            ) from error

        finally:
            if temp_path and temp_path.exists():
                temp_path.unlink(missing_ok=True)

        raise BackupError(
            f"Backup failed without producing result (reason={reason}, attempt={attempt})."
        )

    def _build_http_client(self, config: ServiceConfig) -> httpx.Client:
        """
        Creates an HTTP client configured for backup requests.
        """
        return httpx.Client(
            timeout=config.request_timeout_seconds,
            follow_redirects=True,
            headers={"User-Agent": "CourseHubDatabaseBackup/1.0"},
        )

    def _build_target_path(self) -> Path:
        """
        Generates a unique backup file path.
        """
        ensure_runtime_dirs(self.paths)

        filename = (
            f"coursehub-db-export-{local_now().strftime('%Y-%m-%dT%H-%M-%S')}.dump"
        )
        target_path = self.paths.backup_dir / filename

        counter = 1
        while target_path.exists():
            target_path = (
                self.paths.backup_dir
                / f"{target_path.stem}-{counter}{target_path.suffix}"
            )
            counter += 1

        return target_path

    def _cleanup_old_backups(self, retention_days: int, keep_file: Path) -> None:
        """
        Deletes backups older than the retention window (14 days).
        """
        cutoff = time.time() - retention_days * 24 * 60 * 60

        for candidate in self.paths.backup_dir.iterdir():
            if not candidate.is_file() or candidate == keep_file:
                continue

            try:
                if candidate.stat().st_mtime < cutoff:
                    candidate.unlink(missing_ok=True)
            except OSError as error:
                self.logger.warning(
                    "Failed to remove expired backup %s: %s",
                    candidate.name,
                    error,
                )

    @contextmanager
    def _run_lock(self):
        """
        Ensures only one backup process runs at a time using a filesystem lock.
        """
        ensure_runtime_dirs(self.paths)

        lock_path = self.paths.lock_path
        stale_after_seconds = 6 * 60 * 60  # 6 hours

        if lock_path.exists():
            try:
                age_seconds = time.time() - lock_path.stat().st_mtime
            except OSError:
                age_seconds = 0

            if age_seconds > stale_after_seconds:
                lock_path.unlink(missing_ok=True)

        try:
            fd = os.open(lock_path, os.O_CREAT | os.O_EXCL | os.O_WRONLY)
        except FileExistsError as error:
            raise AlreadyRunningError(
                f"Backup already running. Remove {lock_path} if stale."
            ) from error

        try:
            os.write(fd, f"{os.getpid()}\n".encode("utf-8"))
            os.close(fd)
            yield # gives control back to the caller to perform the backup while holding the lock
        finally:
            lock_path.unlink(missing_ok=True)
