"""
Backup scheduling logic.

This module defines time-based decision making for when backups should run,
based on configuration and previous execution state.
"""

from __future__ import annotations

from datetime import datetime, timedelta

from .config import ServiceConfig
from .state import ServiceState


def local_now() -> datetime:
    """
    Get the current local time with timezone awareness.

    Returns:
        datetime: Current local datetime.
    """
    return datetime.now().astimezone()


def scheduled_datetime(now: datetime, config: ServiceConfig) -> datetime:
    """
    Compute today's scheduled backup time.

    Args:
        now (datetime): Current reference time.
        config (ServiceConfig): Scheduling configuration.

    Returns:
        datetime: Today's scheduled execution time.
    """
    return now.replace(
      hour=config.schedule_hour,
      minute=config.schedule_minute,
      second=0,
      microsecond=0,
    )


def is_backup_due(now: datetime, config: ServiceConfig, state: ServiceState) -> bool:
    """
    Determine whether a backup should run now.

    Rules:
    - Do not run before scheduled time
    - Run if no previous successful backup exists
    - Otherwise run once per day after success

    Args:
        now (datetime): Current time.
        config (ServiceConfig): Scheduling configuration.
        state (ServiceState): Current backup state.

    Returns:
        bool: True if backup should run, False otherwise.
    """
    if now < scheduled_datetime(now, config):
        return False

    last_success = state.last_success_datetime()
    if last_success is None:
        return True

    return last_success.astimezone(now.tzinfo).date() != now.date()


def next_nominal_run(now: datetime, config: ServiceConfig) -> datetime:
    """
    Compute the next scheduled backup time.

    If the scheduled time for today has passed, returns tomorrow's schedule.

    Args:
        now (datetime): Current time.
        config (ServiceConfig): Scheduling configuration.

    Returns:
        datetime: Next scheduled backup execution time.
    """
    scheduled_today = scheduled_datetime(now, config)
    if now < scheduled_today:
        return scheduled_today

    return scheduled_today + timedelta(days=1)
