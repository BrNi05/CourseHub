from __future__ import annotations

import argparse
from datetime import datetime
import logging
from pathlib import Path

from .backup import (
  AlreadyRunningError,
  AuthenticationError,
  BackupClient,
  ConfigurationError,
)
from .config import ConfigStore
from .launchd import (
  get_launch_agent_status,
  install_launch_agent,
  uninstall_launch_agent,
)
from .logging_utils import configure_logging
from .paths import default_paths
from .scheduler import is_backup_due, local_now, next_nominal_run
from .state import StateStore


# Build the argument parser with subcommands for each action
def build_parser() -> argparse.ArgumentParser:
  parser = argparse.ArgumentParser(description='CourseHub database backup helper.')
  subparsers = parser.add_subparsers(dest='command', required=True)

  subparsers.add_parser('status', help='Show current configuration and state.')
  subparsers.add_parser('clone', help='Download a backup immediately.')
  subparsers.add_parser('scheduled-run', help='Run only if today is due.')

  set_cookie_parser = subparsers.add_parser('set-cookie', help='Store the auth cookie value.')
  set_cookie_parser.add_argument('value', help='Cookie value.')

  subparsers.add_parser('clear-cookie', help='Delete the stored auth cookie.')

  set_schedule_parser = subparsers.add_parser(
    'set-schedule',
    help='Update the daily schedule and reload the LaunchAgent if installed.',
  )
  set_schedule_parser.add_argument('--hour', type=int, required=True)
  set_schedule_parser.add_argument('--minute', type=int, required=True)

  logs_parser = subparsers.add_parser('logs', help='Show recent log lines.')
  logs_parser.add_argument('--lines', type=int, default=50)

  subparsers.add_parser('install-agent', help='Install or update the LaunchAgent.')
  subparsers.add_parser('uninstall-agent', help='Remove the LaunchAgent.')

  return parser


# Main entry point for the CLI
def main(argv: list[str] | None = None) -> int:
  parser = build_parser()
  args = parser.parse_args(argv)

  paths = default_paths()
  logger = configure_logging(paths)
  config_store = ConfigStore(paths.config_path)
  state_store = StateStore(paths.state_path)
  backup_client = BackupClient(paths, config_store, state_store, logger)

  try:
    command = args.command

    if command == 'status':
      return _status(paths, config_store, state_store)

    if command == 'clone':
      return _run_backup(backup_client, reason='manual')

    if command == 'scheduled-run':
      return _scheduled_run(backup_client, config_store, state_store, logger)

    if command == 'set-cookie':
      return _set_cookie(config_store, args.value)

    if command == 'clear-cookie':
      return _clear_cookie(config_store)

    if command == 'set-schedule':
      return _set_schedule(paths, config_store, args.hour, args.minute)

    if command == 'logs':
      return _show_logs(paths.log_path, args.lines)

    if command == 'install-agent':
      return _install_agent(paths, config_store)

    if command == 'uninstall-agent':
      return _uninstall_agent(paths)

  except (ConfigurationError, AuthenticationError, AlreadyRunningError, RuntimeError, ValueError) as error:
    print(f'Error: {error}')
    return 1

  parser.print_help()
  return 1


def _status(paths, config_store: ConfigStore, state_store: StateStore) -> int:
  config = config_store.load()
  state = state_store.load()
  now = local_now()
  due_now = is_backup_due(now, config, state)
  next_run = next_nominal_run(now, config)

  print(f'\nEndpoint: {config.endpoint}')
  print(f'Cookie: {config.masked_cookie()}')
  print(f'Schedule: {config.schedule_hour:02d}:{config.schedule_minute:02d} local time')
  print(f'Backups: {paths.backup_dir}')
  print(f'Config: {paths.config_path}')
  print(f'State: {paths.state_path}')
  print(f'Log: {paths.log_path}')
  print(f'Last success: {_format_iso(state.last_success)}')
  print(f'Last attempt: {_format_iso(state.last_attempt)}')
  print(f'Last status: {state.last_status}')
  print(f'Last file: {state.last_file or "none"}')
  print(f'Last size: {state.last_bytes} bytes')
  print(f'Last reason: {state.last_reason or "n/a"}')
  print(f'Last error: {state.last_error or "none"}')
  print(f'Due now: {"yes" if due_now else "no"}')
  print(f'Next nominal run: {next_run.strftime("%Y-%m-%d %H:%M:%S %Z")}')

  try:
    agent_status = get_launch_agent_status(paths)
    print(f'\nLaunchAgent installed: {"yes" if agent_status.installed else "no"}')
    print(f'LaunchAgent loaded: {"yes" if agent_status.loaded else "no"}')
  except RuntimeError as error:
    print(f'LaunchAgent status: unavailable ({error})')

  return 0


def _run_backup(backup_client: BackupClient, reason: str) -> int:
  result = backup_client.run_now(reason)
  print(f'\nBackup saved to {result.file_path}')
  print(f'Bytes written: {result.bytes_written}')
  print(f'Completed at: {result.completed_at.strftime("%Y-%m-%d %H:%M:%S %Z")}')
  return 0


def _scheduled_run(backup_client: BackupClient, config_store: ConfigStore, state_store: StateStore, logger: logging.Logger) -> int:
  config = config_store.load()
  state = state_store.load()
  now = local_now()

  if not is_backup_due(now, config, state):
    logger.info('\nScheduled invocation skipped because no backup is due at %s.', now.isoformat())
    return 0

  return _run_backup(backup_client, reason='scheduled')


def _set_cookie(config_store: ConfigStore, value: str) -> int:
  config = config_store.load()
  cookie_value = value.strip()
  if not cookie_value:
    raise ValueError('Cookie value cannot be empty.')

  config.cookie_value = cookie_value
  config_store.save(config)

  print('\nCookie saved.')
  return 0


def _clear_cookie(config_store: ConfigStore) -> int:
  config = config_store.load()
  config.cookie_value = None
  config_store.save(config)

  print('\nCookie cleared.')
  return 0


def _set_schedule(paths, config_store: ConfigStore, hour: int, minute: int) -> int:
  config = config_store.load()
  config.schedule_hour = hour
  config.schedule_minute = minute
  config_store.save(config)
  print(f'\nSchedule updated to {hour:02d}:{minute:02d}.')

  try:
    if paths.launch_agent_path.exists():
      install_launch_agent(paths, config)
      print('LaunchAgent reloaded with the new schedule.')
  except RuntimeError as error:
    print(f'LaunchAgent reload skipped: {error}')

  return 0


def _show_logs(log_path: Path, lines: int) -> int:
  if not log_path.exists():
    print('No log file exists yet.')
    return 0

  with log_path.open('r', encoding='utf-8') as handle:
    content = handle.readlines()
    print() # spacer

  for line in content[-lines:]:
    print(line.rstrip())
  return 0


def _install_agent(paths, config_store: ConfigStore) -> int:
  config = config_store.load()
  installed_path = install_launch_agent(paths, config)
  print(f'\nLaunchAgent installed at {installed_path}')
  return 0


def _uninstall_agent(paths) -> int:
  uninstall_launch_agent(paths)
  print('\nLaunchAgent removed.')
  return 0


def _format_iso(value: str | None) -> str:
  if not value:
    return 'never'
  return datetime.fromisoformat(value).astimezone().strftime('%Y-%m-%d %H:%M:%S %Z')
