#!/usr/bin/env bash
# One command to play with Aitiome: builds + starts the engine (HTTP + the web
# app in one shot). The web app proxies /api to the engine and falls back to
# fixtures, so it works even if the engine is still warming up.
set -euo pipefail
cd "$(dirname "$0")"

echo "==> building engine"
go build -o bin/httpd ./services/cmd/httpd

echo "==> starting engine on :8787"
./bin/httpd >/tmp/aitiome-httpd.log 2>&1 &
ENGINE=$!
trap 'kill $ENGINE 2>/dev/null || true' EXIT

if [ ! -d web/node_modules ]; then
  echo "==> installing web deps (first run)"
  (cd web && npm install)
fi

echo ""
echo "  Aitiome is starting."
echo "  Open  http://localhost:5273"
echo "  (engine health: http://localhost:8787/health   MCP: make run-mcp)"
echo ""

cd web && npm run dev
