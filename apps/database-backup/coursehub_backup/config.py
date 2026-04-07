"""
Configuration module for the database backup service.

This module defines:
- ServiceConfig: a dataclass representing runtime configuration such as endpoint,
  authentication cookie, scheduling parameters, retry policy, and retention settings.
- ConfigStore: persistence layer for loading and saving configuration from/to JSON files,
  with validation and safe atomic writes.
- validate_schedule: utility function ensuring scheduled backup time is within valid 24-hour bounds.

The configuration system is designed to be simple, file-based, and safe for concurrent usage.
"""

from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path

DEFAULT_ENDPOINT = "https://coursehub.hu/api/database-backup/download"
DEFAULT_COOKIE_NAME = "coursehub_auth"


@dataclass
class ServiceConfig:
    """
    Represents the configuration for the database backup service,
    including endpoint, authentication cookie, schedule, and retention settings.
    """
    endpoint: str = DEFAULT_ENDPOINT
    cookie_name: str = DEFAULT_COOKIE_NAME
    cookie_value: str | None = None
    schedule_hour: int = 11
    schedule_minute: int = 0
    request_timeout_seconds: float = 300.0
    max_retries: int = 3
    retention_days: int = 14

    def masked_cookie(self) -> str:
        """
        Returns a masked version of the cookie value for safe display.

        If no cookie is configured, returns 'not configured'.
        """
        if not self.cookie_value:
            return "not configured"

        return f"{self.cookie_value[:6]}...{self.cookie_value[-4:]}"


class ConfigStore:
    """
    Handles loading and saving the service configuration to a JSON file.
    """

    def __init__(self, path: Path):
        self.path = path

    def load(self) -> ServiceConfig:
        """
        Loads the configuration from a JSON file.

        - Applies defaults for missing fields
        - Validates schedule values
        - Returns a ServiceConfig instance
        """
        if not self.path.exists():
            return ServiceConfig()

        with self.path.open("r", encoding="utf-8") as handle:
            raw = json.load(handle)

        config = ServiceConfig(
            endpoint=str(raw.get("endpoint", DEFAULT_ENDPOINT)),
            cookie_name=str(raw.get("cookie_name", DEFAULT_COOKIE_NAME)),
            cookie_value=raw.get("cookie_value"),
            schedule_hour=int(raw.get("schedule_hour", 11)),
            schedule_minute=int(raw.get("schedule_minute", 0)),
            request_timeout_seconds=float(raw.get("request_timeout_seconds", 300.0)),
            max_retries=max(1, int(raw.get("max_retries", 3))),
            retention_days=max(1, int(raw.get("retention_days", 14))),
        )

        validate_schedule(config.schedule_hour, config.schedule_minute)
        return config

    def save(self, config: ServiceConfig) -> None:
        """
        Saves the configuration to a JSON file safely.

        - Validates schedule before saving
        - Writes atomically using a temporary file
        - Sets secure file permissions (0o600)
        """
        validate_schedule(config.schedule_hour, config.schedule_minute)

        self.path.parent.mkdir(parents=True, exist_ok=True)
        temp_path = self.path.with_suffix(".tmp")

        with temp_path.open("w", encoding="utf-8") as handle:
            json.dump(asdict(config), handle, indent=2)
            handle.write("\n")

        os.chmod(temp_path, 0o600)
        temp_path.replace(self.path)


def validate_schedule(hour: int, minute: int) -> None:
    """
    Validates that a schedule time is within valid 24-hour bounds.

    Raises:
        ValueError: If hour is not in [0, 23] or minute is not in [0, 59].
    """
    if hour < 0 or hour > 23:
        raise ValueError("Hour must be between 0 and 23.")
    if minute < 0 or minute > 59:
        raise ValueError("Minute must be between 0 and 59.")
