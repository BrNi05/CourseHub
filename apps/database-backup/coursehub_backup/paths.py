"""
Filesystem layout and runtime path management for the backup service.

Defines all application directories and file locations, including:
- configuration and state storage
- backups and logs
- macOS LaunchAgent integration paths
- runtime lock file location
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

LAUNCH_AGENT_LABEL = 'hu.coursehub.database-backup'


@dataclass(frozen=True)
class ServicePaths:
    """
    Immutable container for all filesystem paths used by the application.

    This centralizes all runtime locations such as:
    - application support directory
    - configuration and state files
    - backup storage location
    - logging outputs
    - LaunchAgent configuration files
    - process lock file
    """

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


def default_paths() -> ServicePaths:
    """
    Construct the default filesystem layout for the application.

    Returns:
        ServicePaths: A fully populated set of platform-specific paths.

    Notes:
        - Uses macOS Application Support directory under the user's home folder
        - Assumes LaunchAgents directory for background service registration
    """

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


def ensure_runtime_dirs(paths: ServicePaths) -> None:
    """
    Ensure all required runtime directories exist.

    Creates directories if they do not already exist:
    - application support directory
    - backup storage directory
    - logging directory

    Args:
        paths (ServicePaths): Resolved application filesystem paths.
    """

    paths.app_support_dir.mkdir(parents=True, exist_ok=True)
    paths.backup_dir.mkdir(parents=True, exist_ok=True)
    paths.log_dir.mkdir(parents=True, exist_ok=True)
