#!/usr/bin/env bash
# 本机启动职块 Web（最新 dist）
set -euo pipefail
cd "$(dirname "$0")/.."
export HOST="${HOST:-127.0.0.1}"
export PORT="${PORT:-8787}"
export JOB_BLOCK_PUBLIC_URL="${JOB_BLOCK_PUBLIC_URL:-http://127.0.0.1:8787}"
export JOB_BLOCK_DEV_AUTH="${JOB_BLOCK_DEV_AUTH:-1}"

echo "Building..."
npx tsc --pretty false

# 释放端口
if lsof -ti ":$PORT" >/dev/null 2>&1; then
  echo "Killing process on :$PORT"
  lsof -ti ":$PORT" | xargs kill -9 2>/dev/null || true
  sleep 1
fi

echo "Starting http://$HOST:$PORT  (DEV_AUTH=$JOB_BLOCK_DEV_AUTH)"
exec node dist/server.js
