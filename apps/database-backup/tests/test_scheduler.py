"""
Unit tests for the backup scheduling logic.

This module verifies the correctness of scheduling decisions, including:
- Whether a backup is due based on the configured schedule time
- Handling of successful backups within the same day
- Day boundary behavior for last-success timestamps
- Calculation of the next nominal scheduled run
"""

from __future__ import annotations

from datetime import datetime, timedelta, timezone
import unittest

from coursehub_backup.config import ServiceConfig
from coursehub_backup.scheduler import is_backup_due, next_nominal_run
from coursehub_backup.state import ServiceState


class SchedulerTests(unittest.TestCase):
    """
    Test suite for scheduler logic.

    Covers:
    - due/undue decision logic for backups
    - last-success filtering within the same day
    - correct next-run computation across day boundaries
    """

    def setUp(self) -> None:
        """Initialize common configuration and timezone used across tests."""
        self.config = ServiceConfig(schedule_hour=11, schedule_minute=0)
        self.tz = timezone(timedelta(hours=2))

    def test_not_due_before_schedule(self) -> None:
        """Backup should not be due before the scheduled hour."""
        now = datetime(2026, 4, 5, 10, 30, tzinfo=self.tz)
        self.assertFalse(is_backup_due(now, self.config, ServiceState()))

    def test_due_after_schedule_with_no_success_today(self) -> None:
        """Backup should be due after schedule time if no success occurred today."""
        now = datetime(2026, 4, 5, 11, 5, tzinfo=self.tz)
        self.assertTrue(is_backup_due(now, self.config, ServiceState()))

    def test_not_due_after_schedule_if_successful_today(self) -> None:
        """Backup should not be due if a successful run already happened today."""
        now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
        state = ServiceState(
            last_success=datetime(2026, 4, 5, 7, 15, tzinfo=self.tz).isoformat()
        )
        self.assertFalse(is_backup_due(now, self.config, state))

    def test_due_after_schedule_if_last_success_was_yesterday(self) -> None:
        """Backup should be due if last success occurred on a previous day."""
        now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
        state = ServiceState(
            last_success=datetime(2026, 4, 4, 23, 55, tzinfo=self.tz).isoformat()
        )
        self.assertTrue(is_backup_due(now, self.config, state))

    def test_next_nominal_run_rolls_to_tomorrow_after_schedule(self) -> None:
        """Next run should correctly roll over to the next day after schedule time."""
        now = datetime(2026, 4, 5, 18, 0, tzinfo=self.tz)
        next_run = next_nominal_run(now, self.config)
        self.assertEqual(
            next_run,
            datetime(2026, 4, 6, 11, 0, tzinfo=self.tz),
        )


if __name__ == '__main__':
    unittest.main()
