"""
State persistence layer for the backup service.

This module defines:
- ServiceState: in-memory representation of backup metadata
- StateStore: JSON-based persistence layer for loading/saving and updating state

It is responsible for tracking backup attempts, successes, and failures.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import json
from pathlib import Path


@dataclass
class ServiceState:
    """
    In-memory representation of backup metadata.

    Tracks the last known state of backup operations, including:
    - last successful backup
    - last attempt
    - status
    - error information
    - file and size metadata
    - reason for the operation
    """

    last_success: str | None = None
    last_attempt: str | None = None
    last_status: str = 'never'
    last_error: str | None = None
    last_file: str | None = None
    last_bytes: int = 0
    last_reason: str | None = None

    def last_success_datetime(self) -> datetime | None:
        """
        Convert last_success timestamp to a datetime object.

        Returns:
            datetime | None: Parsed datetime if available, otherwise None.
        """
        if not self.last_success:
            return None
        return datetime.fromisoformat(self.last_success)


class StateStore:
    """
    JSON-based persistence layer for ServiceState.

    Responsible for:
    - Loading state from disk
    - Saving state atomically
    - Recording backup lifecycle events (attempt, success, failure)
    """

    def __init__(self, path: Path):
        """
        Initialize the state store.

        Args:
            path (Path): Path to the JSON file storing state.
        """
        self.path = path

    def load(self) -> ServiceState:
        """
        Load service state from disk.

        Returns:
            ServiceState: Loaded state, or default state if file does not exist.
        """
        if not self.path.exists():
            return ServiceState()

        with self.path.open('r', encoding='utf-8') as handle:
            raw = json.load(handle)

        return ServiceState(
          last_success=raw.get('last_success'),
          last_attempt=raw.get('last_attempt'),
          last_status=str(raw.get('last_status', 'never')),
          last_error=raw.get('last_error'),
          last_file=raw.get('last_file'),
          last_bytes=int(raw.get('last_bytes', 0)),
          last_reason=raw.get('last_reason'),
        )

    def save(self, state: ServiceState) -> None:
        """
        Persist service state to disk atomically.

        Args:
            state (ServiceState): State to persist.
        """
        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.path.with_suffix('.tmp')

        with temp_path.open('w', encoding='utf-8') as handle:
            json.dump(asdict(state), handle, indent=2)
            handle.write('\n')

        temp_path.replace(self.path)

    def record_attempt(self, when: datetime, reason: str) -> None:
        """
        Record a backup attempt.

        Args:
            when (datetime): Timestamp of the attempt.
            reason (str): Reason for triggering the backup.
        """
        state = self.load()
        state.last_attempt = when.isoformat()
        state.last_status = 'running'
        state.last_error = None
        state.last_reason = reason

        self.save(state)

    def record_success(
        self,
        when: datetime,
        file_name: str,
        bytes_written: int,
        reason: str,
    ) -> None:
        """
        Record a successful backup.

        Args:
            when (datetime): Timestamp of success.
            file_name (str): Backup file name.
            bytes_written (int): Size of backup in bytes.
            reason (str): Reason for triggering the backup.
        """
        state = self.load()
        state.last_success = when.isoformat()
        state.last_attempt = when.isoformat()
        state.last_status = 'success'
        state.last_error = None
        state.last_file = file_name
        state.last_bytes = bytes_written
        state.last_reason = reason

        self.save(state)

    def record_failure(self, when: datetime, error_message: str, reason: str) -> None:
        """
        Record a failed backup attempt.

        Args:
            when (datetime): Timestamp of failure.
            error_message (str): Error description.
            reason (str): Reason for triggering the backup.
        """
        state = self.load()
        state.last_attempt = when.isoformat()
        state.last_status = 'failed'
        state.last_error = error_message
        state.last_reason = reason

        self.save(state)
