#!/bin/bash

# Error mgmt
set -e
on_error() { echo "Script failed. Error on line: $1. Terminating..."; }
trap 'on_error $LINENO' ERR

# Privilige check
if [[ "$EUID" -ne 0 ]]; then
   echo "Script not running as root. Terminating..."
   exit 1
fi

# Create the working dir (manually)
TARGET_DIR="/home/barni/Documents/coursehub_test"
# mkdir -p "$TARGET_DIR"

# Manually create the docker compose file

# Allow through ufw
ufw allow in on wg0 from 10.200.0.3 to 10.200.0.1 port 32000 proto tcp
ufw allow in on wg0 from 10.200.0.16 to 10.200.0.1 port 32000 proto tcp
ufw allow in on wg0 from 10.200.0.17 to 10.200.0.1 port 32000 proto tcp
ufw reload

# Create systemd service for compose up on boot
cat <<EOF > /etc/systemd/system/compose-up-coursehub_test.service
[Unit]
Description=docker compose up on (re)boot
Requires=docker.service
After=docker.service
OnFailure=service-error@%n.service
StartLimitAction=none
FailureAction=none
StartLimitBurst=5
StartLimitIntervalSec=120s

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$TARGET_DIR
ExecStart=/usr/bin/docker compose up -d
ExecStop=/usr/bin/docker compose down
StandardOutput=null
StandardError=journal

Nice=-10
IOSchedulingClass=best-effort
IOSchedulingPriority=0

Restart=on-failure
RestartSec=15s

[Install]
WantedBy=multi-user.target
EOF

sudo systemctl daemon-reload
sudo systemctl enable compose-up-coursehub_test.service
sudo systemctl start compose-up-coursehub_test.service

echo "Done."