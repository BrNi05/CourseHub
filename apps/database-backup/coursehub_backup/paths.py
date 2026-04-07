from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

LAUNCH_AGENT_LABEL = 'hu.coursehub.database-backup'


# Represents the various file paths used by the app
@dataclass(frozen=True)
class ServicePaths:
  project_root: Path
  app_support_dir: Path
  config_path: Path
  state_path: Path
  backup_dir: Path
  log_dir: Path
  log_path: Path
  launchd_stdout_path: Path
  launchd_stderr_path: Path
  launch_agent_path: Path
  lock_path: Path


# Returns the default file paths for the app
def default_paths() -> ServicePaths:
  project_root = Path(__file__).resolve().parents[1]
  app_support_dir = Path.home() / 'Library' / 'Application Support' / 'CourseHubDatabaseBackup'
  launch_agents_dir = Path.home() / 'Library' / 'LaunchAgents'

  return ServicePaths(
    project_root=project_root,
    app_support_dir=app_support_dir,
    config_path=app_support_dir / 'config.json',
    state_path=app_support_dir / 'state.json',
    backup_dir=app_support_dir / 'backups',
    log_dir=app_support_dir / 'logs',
    log_path=app_support_dir / 'logs' / 'app.log',
    launchd_stdout_path=app_support_dir / 'logs' / 'launchd.stdout.log',
    launchd_stderr_path=app_support_dir / 'logs' / 'launchd.stderr.log',
    launch_agent_path=launch_agents_dir / f'{LAUNCH_AGENT_LABEL}.plist',
    lock_path=app_support_dir / 'run.lock',
  )


# Ensures that the necessary runtime directories exist
def ensure_runtime_dirs(paths: ServicePaths) -> None:
  paths.app_support_dir.mkdir(parents=True, exist_ok=True)
  paths.backup_dir.mkdir(parents=True, exist_ok=True)
  paths.log_dir.mkdir(parents=True, exist_ok=True)
