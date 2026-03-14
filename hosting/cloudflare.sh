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

# Install Cloudflare
echo "Checking for existing Cloudflare installation..."
if ! command -v cloudflared >/dev/null 2>&1; then   
    mkdir -p --mode=0755 /usr/share/keyrings
    curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
    echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared bookworm main' | tee /etc/apt/sources.list.d/cloudflared.list
    apt-get update && apt-get install -y cloudflared

    echo -e "Cloudflare installation complete.\n"
else
    echo -e "Cloudflare is already installed.\n"
fi

# Authenticate
CERT="/root/.cloudflared/cert.pem"

read -rp "Checking if login is neccessary. Press any key to continue..."
if [[ -f "$CERT" ]]; then
    echo -e "\nCloudflare is already authenticated.\n"
else
    cloudflared tunnel login
    echo -e "\nCloudflare authentication complete.\n"
fi

# Base Cloudflared directory
CF_DIR="/root/.cloudflared"
mkdir -p "$CF_DIR"

# Create a tunnel
DOMAIN="coursehub.hu"
API_PORT=30000

TUNNEL_NAME="coursehub"

echo ""
cloudflared tunnel create "$TUNNEL_NAME"
echo -e "\nTunnel $TUNNEL_NAME created successfully.\n"

# Create config file
TUNNEL_ID=$(cloudflared tunnel list --output json | jq -r ".[] | select(.name==\"$TUNNEL_NAME\") | .id")
CONFIG_FILE="$CF_DIR/config-$TUNNEL_NAME.yml"

cat <<EOF > "$CONFIG_FILE"
tunnel: $TUNNEL_ID
credentials-file: $CF_DIR/$TUNNEL_ID.json

ingress:
  - hostname: $DOMAIN
    service: http://localhost:$API_PORT
  - service: http_status:404
EOF

cloudflared tunnel route dns --overwrite-dns "$TUNNEL_NAME" "$DOMAIN"
echo -e "CNAME record created for $DOMAIN pointing to tunnel: $TUNNEL_NAME.\n"

# Systemd service for this tunnel
cat <<EOF > /etc/systemd/system/cftunnel-"$TUNNEL_NAME".service
[Unit]
Description=Cloudflare Tunnel for CourseHub API
Wants=network-online.target
After=network-online.target

[Service]
ExecStart=/usr/bin/cloudflared --config $CONFIG_FILE tunnel run $TUNNEL_NAME
Restart=always
RestartSec=10s
User=root

# IO and CPU
Nice=-10
IOSchedulingClass=best-effort
IOSchedulingPriority=0

# Security
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now cftunnel-"$TUNNEL_NAME".service

echo -e "\nCloudflare tunnel setup complete. Service enabled and started. A reboot may be required."