#!/usr/bin/env bash
set -euo pipefail

APP_NAME="${APP_NAME:-endless-cms}"
APP_PORT="${PORT:-3000}"
WITH_POSTGRES="${WITH_POSTGRES:-0}"
SEED_DATABASE="${SEED_DATABASE:-1}"

if ! command -v pnpm >/dev/null 2>&1; then
  echo "pnpm is required. Install it with: corepack enable && corepack prepare pnpm@10.24.0 --activate"
  exit 1
fi

if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example. Edit it before running this script again."
    exit 1
  fi
  echo ".env is missing."
  exit 1
fi

if [ "$WITH_POSTGRES" = "1" ]; then
  if ! command -v docker >/dev/null 2>&1; then
    echo "Docker is required when WITH_POSTGRES=1."
    exit 1
  fi
  docker compose up -d
fi

pnpm install --frozen-lockfile
pnpm db:generate
pnpm db:push

if [ "$SEED_DATABASE" = "1" ]; then
  pnpm db:seed
fi

pnpm build

if command -v pm2 >/dev/null 2>&1; then
  PORT="$APP_PORT" pm2 restart "$APP_NAME" --update-env || PORT="$APP_PORT" pm2 start pnpm --name "$APP_NAME" -- start
  pm2 save || true
else
  echo "PM2 is not installed. Start manually with: PORT=$APP_PORT pnpm start"
fi
