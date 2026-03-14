#!/bin/bash

# Error mgmt
set -e
on_error() { echo "Script failed. Error on line: $1. Terminating..."; }
trap 'on_error $LINENO' ERR

# Load GITHUB_TOKEN from .env
if [ -f .env ]; then
  export $(grep '^GITHUB_TOKEN=' .env)
else
  echo ".env not found!"
  exit 1
fi

OWNER="brni05"
IMAGE_NAME="coursehub-backend"
TAG=$(jq -r '.version' ../apps/backend/package.json)

VERSION_IMAGE="ghcr.io/$OWNER/$IMAGE_NAME:$TAG"
LATEST_IMAGE="ghcr.io/$OWNER/$IMAGE_NAME:latest"

echo "Version tag: $TAG"
echo "GHCR versioned image: $VERSION_IMAGE"
echo "GHCR latest image: $LATEST_IMAGE"

echo
read -p "Continue?"

echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$OWNER" --password-stdin
echo

docker build -t backend:latest ..

docker tag backend:latest "$VERSION_IMAGE"
docker tag backend:latest "$LATEST_IMAGE"

docker push "$VERSION_IMAGE"
docker push "$LATEST_IMAGE"

echo "Images pushed to GHCR."

## Usage: as a VSC task