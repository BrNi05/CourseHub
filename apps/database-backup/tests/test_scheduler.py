from datetime import datetime, timedelta, timezone
import unittest

from coursehub_backup.config import ServiceConfig
from coursehub_backup.scheduler import is_backup_due, next_nominal_run
from coursehub_backup.state import ServiceState


class SchedulerTests(unittest.TestCase):
  def setUp(self) -> None:
    self.config = ServiceConfig(schedule_hour=11, schedule_minute=0)
    self.tz = timezone(timedelta(hours=2))

  def test_not_due_before_schedule(self) -> None:
    now = datetime(2026, 4, 5, 10, 30, tzinfo=self.tz)
    self.assertFalse(is_backup_due(now, self.config, ServiceState()))

  def test_due_after_schedule_with_no_success_today(self) -> None:
    now = datetime(2026, 4, 5, 11, 5, tzinfo=self.tz)
    self.assertTrue(is_backup_due(now, self.config, ServiceState()))

  def test_not_due_after_schedule_if_successful_today(self) -> None:
    now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
    state = ServiceState(last_success=datetime(2026, 4, 5, 7, 15, tzinfo=self.tz).isoformat())
    self.assertFalse(is_backup_due(now, self.config, state))

  def test_due_after_schedule_if_last_success_was_yesterday(self) -> None:
    now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
    state = ServiceState(last_success=datetime(2026, 4, 4, 23, 55, tzinfo=self.tz).isoformat())
    self.assertTrue(is_backup_due(now, self.config, state))

  def test_next_nominal_run_rolls_to_tomorrow_after_schedule(self) -> None:
    now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
    next_run = next_nominal_run(now, self.config)
    self.assertEqual(next_run, datetime(2026, 4, 6, 11, 0, tzinfo=self.tz))


if __name__ == '__main__':
  unittest.main()
