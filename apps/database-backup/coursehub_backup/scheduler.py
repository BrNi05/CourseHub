from __future__ import annotations

from datetime import datetime, timedelta

from .config import ServiceConfig
from .state import ServiceState


def local_now() -> datetime:
  return datetime.now().astimezone()


def scheduled_datetime(now: datetime, config: ServiceConfig) -> datetime:
  return now.replace(
    hour=config.schedule_hour,
    minute=config.schedule_minute,
    second=0,
    microsecond=0,
  )


def is_backup_due(now: datetime, config: ServiceConfig, state: ServiceState) -> bool:
  if now < scheduled_datetime(now, config):
    return False

  last_success = state.last_success_datetime()
  if last_success is None:
    return True

  return last_success.astimezone(now.tzinfo).date() != now.date()


def next_nominal_run(now: datetime, config: ServiceConfig) -> datetime:
  scheduled_today = scheduled_datetime(now, config)
  if now < scheduled_today:
    return scheduled_today
  return scheduled_today + timedelta(days=1)
