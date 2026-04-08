#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/todo-list}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [ ! -d "$APP_DIR" ]; then
  echo "App directory does not exist: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE in $APP_DIR" >&2
  exit 1
fi

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --build --remove-orphans
docker image prune -f
