from __future__ import annotations

from dataclasses import asdict, dataclass
import json
import os
from pathlib import Path

DEFAULT_ENDPOINT = 'https://coursehub.hu/api/database-backup/download'
DEFAULT_COOKIE_NAME = 'coursehub_auth'


# Represents the configuration for the database backup service
# including endpoint, authentication cookie, schedule, and retention settings
@dataclass
class ServiceConfig:
  endpoint: str = DEFAULT_ENDPOINT
  cookie_name: str = DEFAULT_COOKIE_NAME
  cookie_value: str | None = None
  schedule_hour: int = 11
  schedule_minute: int = 0
  request_timeout_seconds: float = 300.0
  max_retries: int = 3
  retention_days: int = 14

  # Returns a masked version of the cookie value for display purposes
  def masked_cookie(self) -> str:
    if not self.cookie_value:
      return 'not configured'

    return f'{self.cookie_value[:6]}...{self.cookie_value[-4:]}'


# Handles loading and saving the service configuration to a JSON file
class ConfigStore:
  def __init__(self, path: Path):
    self.path = path

  # Loads the configuration from the JSON file, applying defaults and validating the schedule
  def load(self) -> ServiceConfig:
    if not self.path.exists():
      return ServiceConfig()

    with self.path.open('r', encoding='utf-8') as handle:
      raw = json.load(handle)

    config = ServiceConfig(
      endpoint=str(raw.get('endpoint', DEFAULT_ENDPOINT)),
      cookie_name=str(raw.get('cookie_name', DEFAULT_COOKIE_NAME)),
      cookie_value=raw.get('cookie_value'),
      schedule_hour=int(raw.get('schedule_hour', 11)),
      schedule_minute=int(raw.get('schedule_minute', 0)),
      request_timeout_seconds=float(raw.get('request_timeout_seconds', 300.0)),
      max_retries=max(1, int(raw.get('max_retries', 3))),
      retention_days=max(1, int(raw.get('retention_days', 14))),
    )

    validate_schedule(config.schedule_hour, config.schedule_minute)
    return config

  # Saves the configuration to the JSON file, ensuring the schedule is valid and file permissions are secure
  def save(self, config: ServiceConfig) -> None:
    validate_schedule(config.schedule_hour, config.schedule_minute)

    self.path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = self.path.with_suffix('.tmp')
    with temp_path.open('w', encoding='utf-8') as handle:
      json.dump(asdict(config), handle, indent=2)
      handle.write('\n')

    os.chmod(temp_path, 0o600)
    temp_path.replace(self.path)


# Checks if the provided schedule is valid
def validate_schedule(hour: int, minute: int) -> None:
  if hour < 0 or hour > 23:
    raise ValueError('Hour must be between 0 and 23.')
  if minute < 0 or minute > 59:
    raise ValueError('Minute must be between 0 and 59.')
