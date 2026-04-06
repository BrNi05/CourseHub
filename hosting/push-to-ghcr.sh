#!/bin/bash

#? cd /home/barni/Documents/coursehub_prod && docker compose pull backend && docker compose up -d --force-recreate --no-deps backend

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
BUILDER_NAME="coursehub-multiarch"

VERSION_IMAGE="ghcr.io/$OWNER/$IMAGE_NAME:$TAG"
LATEST_IMAGE="ghcr.io/$OWNER/$IMAGE_NAME:latest"

echo "Version tag: $TAG"
echo "GHCR versioned image: $VERSION_IMAGE"
echo "GHCR latest image: $LATEST_IMAGE"

echo
read -p "Continue?"

echo -e "\nLogging in to GHCR..."
echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$OWNER" --password-stdin
echo

# Install deps
echo "Installing dependencies..."
pnpm install --frozen-lockfile
echo

# Build the whole repo
echo "Building the project..."
pnpm run build:all
echo

# Prepare Docker buildx builder for multi-arch builds
echo "Preparing Docker buildx builder..."
if ! docker buildx inspect "$BUILDER_NAME" >/dev/null 2>&1; then
  docker buildx create --use --name "$BUILDER_NAME"
else
  docker buildx use "$BUILDER_NAME"
fi

docker buildx inspect --bootstrap
echo

echo -e "Building multi-arch image for linux/amd64 and linux/arm64...\n"

docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t "$VERSION_IMAGE" \
  -t "$LATEST_IMAGE" \
  --push \
  ..

echo -e "\nImages pushed to GHCR."
