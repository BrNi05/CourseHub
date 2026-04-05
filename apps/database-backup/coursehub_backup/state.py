from __future__ import annotations

from dataclasses import asdict, dataclass
from datetime import datetime
import json
from pathlib import Path


@dataclass
class ServiceState:
  last_success: str | None = None
  last_attempt: str | None = None
  last_status: str = 'never'
  last_error: str | None = None
  last_file: str | None = None
  last_bytes: int = 0
  last_reason: str | None = None

  def last_success_datetime(self) -> datetime | None:
    if not self.last_success:
      return None
    return datetime.fromisoformat(self.last_success)


class StateStore:
  def __init__(self, path: Path):
    self.path = path

  def load(self) -> ServiceState:
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
    self.path.parent.mkdir(parents=True, exist_ok=True)
    temp_path = self.path.with_suffix('.tmp')
    with temp_path.open('w', encoding='utf-8') as handle:
      json.dump(asdict(state), handle, indent=2)
      handle.write('\n')
    temp_path.replace(self.path)

  def record_attempt(self, when: datetime, reason: str) -> None:
    state = self.load()
    state.last_attempt = when.isoformat()
    state.last_status = 'running'
    state.last_error = None
    state.last_reason = reason
    self.save(state)

  def record_success(self, when: datetime, file_name: str, bytes_written: int, reason: str) -> None:
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
    state = self.load()
    state.last_attempt = when.isoformat()
    state.last_status = 'failed'
    state.last_error = error_message
    state.last_reason = reason
    self.save(state)
