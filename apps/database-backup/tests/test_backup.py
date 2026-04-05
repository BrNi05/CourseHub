from __future__ import annotations

from pathlib import Path
import tempfile
import unittest

import httpx

from coursehub_backup.backup import AuthenticationError, BackupClient
from coursehub_backup.config import ConfigStore, ServiceConfig
from coursehub_backup.logging_utils import configure_logging
from coursehub_backup.paths import ServicePaths
from coursehub_backup.state import StateStore


class BackupClientTests(unittest.TestCase):
  def setUp(self) -> None:
    self.temp_dir = tempfile.TemporaryDirectory()
    root = Path(self.temp_dir.name)
    self.paths = ServicePaths(
      project_root=root,
      app_support_dir=root / 'runtime',
      config_path=root / 'runtime' / 'config.json',
      state_path=root / 'runtime' / 'state.json',
      backup_dir=root / 'runtime' / 'backups',
      log_dir=root / 'runtime' / 'logs',
      log_path=root / 'runtime' / 'logs' / 'app.log',
      launchd_stdout_path=root / 'runtime' / 'logs' / 'launchd.stdout.log',
      launchd_stderr_path=root / 'runtime' / 'logs' / 'launchd.stderr.log',
      launch_agent_path=root / 'LaunchAgents' / 'hu.coursehub.database-backup.plist',
      lock_path=root / 'runtime' / 'run.lock',
    )
    self.config_store = ConfigStore(self.paths.config_path)
    self.state_store = StateStore(self.paths.state_path)
    self.logger = configure_logging(self.paths)
    self.config_store.save(
      ServiceConfig(cookie_value='cookie-secret', max_retries=1, request_timeout_seconds=5.0)
    )

  def tearDown(self) -> None:
    self.temp_dir.cleanup()

  def test_successful_download_updates_state_and_writes_file(self) -> None:
    def handler(request: httpx.Request) -> httpx.Response:
      self.assertEqual(request.headers['Cookie'], 'coursehub_auth=cookie-secret')
      return httpx.Response(
        200,
        headers={'Content-Disposition': 'attachment; filename="backup.dump"'},
        content=b'database-backup-bytes',
      )

    backup_client = BackupClient(
      self.paths,
      self.config_store,
      self.state_store,
      self.logger,
      client_factory=lambda _: httpx.Client(transport=httpx.MockTransport(handler)),
      sleeper=lambda _: None,
    )

    result = backup_client.run_now('manual')

    self.assertTrue(result.file_path.exists())
    self.assertEqual(result.file_path.name, 'backup.dump')
    self.assertEqual(result.file_path.read_bytes(), b'database-backup-bytes')

    state = self.state_store.load()
    self.assertEqual(state.last_status, 'success')
    self.assertEqual(state.last_file, 'backup.dump')
    self.assertEqual(state.last_bytes, len(b'database-backup-bytes'))
    self.assertEqual(state.last_reason, 'manual')

  def test_authentication_failure_updates_state(self) -> None:
    def handler(_: httpx.Request) -> httpx.Response:
      return httpx.Response(401, content=b'unauthorized')

    backup_client = BackupClient(
      self.paths,
      self.config_store,
      self.state_store,
      self.logger,
      client_factory=lambda _: httpx.Client(transport=httpx.MockTransport(handler)),
      sleeper=lambda _: None,
    )

    with self.assertRaises(AuthenticationError):
      backup_client.run_now('scheduled')

    state = self.state_store.load()
    self.assertEqual(state.last_status, 'failed')
    self.assertIn('HTTP 401', state.last_error or '')
    self.assertEqual(state.last_reason, 'scheduled')


if __name__ == '__main__':
  unittest.main()
