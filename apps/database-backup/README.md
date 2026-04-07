# CourseHub Database Backup Helper

This is a small Python subproject for macOS that uses the protected CourseHub backup endpoint to download a DB dump on a schedule.

## What it does

- Downloads `https://coursehub.hu/api/database-backup/download`.

- Authenticates with the `coursehub_auth` cookie.

- Runs every day at `11:00` local time.

- Catches up later if the scheduled run was missed and the Mac starts up after that.

- Exposes a CLI for status, manual runs, cookie management, schedule changes, logs, and LaunchAgent install/uninstall.

## Runtime layout

Code lives in the repo, but runtime files are stored in the macOS user profile:

- Config: `~/Library/Application Support/CourseHubDatabaseBackup/config.json`.

- State: `~/Library/Application Support/CourseHubDatabaseBackup/state.json`.

- Backups: `~/Library/Application Support/CourseHubDatabaseBackup/backups`.

- Logs: `~/Library/Application Support/CourseHubDatabaseBackup/logs/app.log`.

- LaunchAgent: `~/Library/LaunchAgents/hu.coursehub.database-backup.plist`.

## Main workflow

Run these from the repo root:

```bash
cd apps/database-backup

python3 -m venv .venv && source .venv/bin/activate

python -m pip install -r requirements.txt

python main.py set-cookie <jwt>

python main.py status

python main.py install-agent
```

`install-agent` writes the currently active Python interpreter into the LaunchAgent plist.

## CLI commands

```bash
# Shows endpoint, cookie status, runtime file locations, last success, last error, due state, next nominal run, and LaunchAgent status
python main.py status

# Forces an immediate backup download
python main.py clone

# Internal command for launchd - it only runs if a backup is actually due
python main.py scheduled-run

# Saves the `coursehub_auth` cookie value
python main.py set-cookie <jwt>

# Removes the stored cookie
python main.py clear-cookie

# Updates the schedule and reloads the LaunchAgent if it is already installed
python main.py set-schedule --hour 11 --minute 0

# Prints the last `N` log lines
python main.py logs --lines 50

# Writes the plist file into `~/Library/LaunchAgents` and loads it with `launchctl`
python main.py install-agent

# Unloads the LaunchAgent and removes the plist file
python main.py uninstall-agent
```

## Scheduling behavior

The LaunchAgent uses:

- `StartCalendarInterval` for the normal daily `11:00` run.

- `RunAtLoad` so the helper can catch up if the Mac starts after the scheduled time.

The helper does not blindly clone on every startup. It checks local state first.

That means:

- Login before `11:00`: it skips.

- Login after `11:00` with no successful backup today: it runs.

- Login after `11:00` when today already succeeded: it skips.

## Repo and test commands

From `apps/database-backup`:

```bash
python3 -m unittest discover -s tests -t .

python main.py status
```
