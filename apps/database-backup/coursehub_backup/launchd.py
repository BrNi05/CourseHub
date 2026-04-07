"""
macOS LaunchAgent management layer for the backup service.

This module is responsible for:
- generating LaunchAgent plist configuration
- installing/uninstalling the agent via launchctl
- querying agent status
- enforcing macOS-only execution constraints
"""

from __future__ import annotations

from dataclasses import dataclass
import os
import plistlib
from pathlib import Path
import subprocess
import sys

from .config import ServiceConfig
from .paths import LAUNCH_AGENT_LABEL, ServicePaths, ensure_runtime_dirs


@dataclass
class LaunchAgentStatus:
    """
    Represents the installation and runtime status of a macOS LaunchAgent.

    Attributes:
        installed (bool): Whether the plist file exists on disk.
        loaded (bool): Whether the agent is currently loaded in launchd.
    """
    installed: bool
    loaded: bool


def ensure_macos() -> None:
    """
    Ensure the current runtime environment is macOS.

    Raises:
        RuntimeError: If the platform is not macOS (darwin).
    """
    if sys.platform != 'darwin':
        raise RuntimeError('LaunchAgent management is only supported on macOS.')


def build_plist_data(paths: ServicePaths, config: ServiceConfig) -> dict[str, object]:
    """
    Build the LaunchAgent plist configuration dictionary.

    Args:
        paths (ServicePaths): Application filesystem paths.
        config (ServiceConfig): Scheduling configuration.

    Returns:
        dict[str, object]: Plist-compatible LaunchAgent configuration.
    """
    ensure_runtime_dirs(paths)

    return {
      'Label': LAUNCH_AGENT_LABEL,
      'ProgramArguments': [
        sys.executable,
        str(paths.project_root / 'main.py'),
        'scheduled-run',
      ],
      'WorkingDirectory': str(paths.project_root),
      'RunAtLoad': True,
      'StartCalendarInterval': {
        'Hour': config.schedule_hour,
        'Minute': config.schedule_minute,
      },
      'ProcessType': 'Background',
      'StandardOutPath': str(paths.launchd_stdout_path),
      'StandardErrorPath': str(paths.launchd_stderr_path),
      'EnvironmentVariables': {
        'PYTHONUNBUFFERED': '1',
      },
    }


def install_launch_agent(paths: ServicePaths, config: ServiceConfig) -> Path:
    """
    Install and load the LaunchAgent.

    This function:
    - writes the plist file
    - unloads any existing agent
    - loads the new configuration via launchctl

    Args:
        paths (ServicePaths): Application filesystem paths.
        config (ServiceConfig): Scheduling configuration.

    Returns:
        Path: Path to the installed LaunchAgent plist file.
    """
    ensure_macos()
    ensure_runtime_dirs(paths)
    paths.launch_agent_path.parent.mkdir(parents=True, exist_ok=True)

    with paths.launch_agent_path.open('wb') as handle:
        plistlib.dump(build_plist_data(paths, config), handle)

    gui_domain = f'gui/{os.getuid()}'

    # Unload any existing LaunchAgent
    subprocess.run(
      ['launchctl', 'bootout', gui_domain, str(paths.launch_agent_path)],
      check=False,
      capture_output=True,
      text=True,
    )

    # Load the new LaunchAgent
    subprocess.run(
      ['launchctl', 'bootstrap', gui_domain, str(paths.launch_agent_path)],
      check=True,
      capture_output=True,
      text=True,
    )

    return paths.launch_agent_path


def uninstall_launch_agent(paths: ServicePaths) -> None:
    """
    Uninstall the LaunchAgent.

    This function unloads the agent (if loaded) and removes the plist file.

    Args:
        paths (ServicePaths): Application filesystem paths.
    """
    ensure_macos()

    gui_domain = f'gui/{os.getuid()}'
    if paths.launch_agent_path.exists():
        subprocess.run(
          ['launchctl', 'bootout', gui_domain, str(paths.launch_agent_path)],
          check=False,
          capture_output=True,
          text=True,
        )

        paths.launch_agent_path.unlink(missing_ok=True)


def get_launch_agent_status(paths: ServicePaths) -> LaunchAgentStatus:
    """
    Query LaunchAgent installation and runtime status.

    Args:
        paths (ServicePaths): Application filesystem paths.

    Returns:
        LaunchAgentStatus: Whether the agent is installed and currently loaded.
    """
    ensure_macos()

    installed = paths.launch_agent_path.exists()
    gui_label = f'gui/{os.getuid()}/{LAUNCH_AGENT_LABEL}'

    result = subprocess.run(
      ['launchctl', 'print', gui_label],
      check=False,
      capture_output=True,
      text=True,
    )

    return LaunchAgentStatus(installed=installed, loaded=result.returncode == 0)
