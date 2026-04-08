#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/todo-list}"
COMPOSE_FILE="docker-compose.prod.yml"
ENV_FILE=".env.production"

if [ ! -d "$APP_DIR" ]; then
  echo "应用目录不存在: $APP_DIR" >&2
  exit 1
fi

cd "$APP_DIR"

if [ ! -f "$ENV_FILE" ]; then
  echo "缺少 $ENV_FILE" >&2
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

APP_PORT="${APP_PORT:-80}"

docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
curl -fsS "http://127.0.0.1:${APP_PORT}/" >/dev/null
curl -fsS "http://127.0.0.1:${APP_PORT}/api/health" >/dev/null
