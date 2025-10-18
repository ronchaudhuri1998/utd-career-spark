#!/usr/bin/env bash

# Unified launcher for the Flask backend and Vite frontend.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_CMD=("python" "run_demo.py")
FRONTEND_DIR="$ROOT_DIR/frontend"
FRONTEND_CMD=("npm" "run" "dev" "--" "--host")

if [[ -f "$ROOT_DIR/.env" ]]; then
    echo "📁 Loading environment from .env"
    set -a
    # shellcheck disable=SC1090
    source "$ROOT_DIR/.env"
    set +a
fi

cleanup() {
    jobs -p | xargs -r kill 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "📦 Checking frontend dependencies..."
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "➡️  Installing frontend dependencies (npm install)..."
    (cd "$FRONTEND_DIR" && npm install)
fi

if [[ ! -f "$BACKEND_DIR/requirements.txt" ]]; then
    echo "⚠️  Missing backend/requirements.txt. Please verify your backend folder."
fi

PORT=5000
if PIDS=$(lsof -ti:"$PORT" 2>/dev/null); then
    if [[ -n "$PIDS" ]]; then
        echo "🧹 Clearing port $PORT (PIDs: $PIDS)..."
        echo "$PIDS" | xargs -r kill
        sleep 1
    fi
fi

echo "🚀 Starting Flask backend..."
(
    cd "$BACKEND_DIR"
    source .venv/bin/activate
    export FRONTEND_DEV_URL="http://127.0.0.1:5173"
    "${BACKEND_CMD[@]}"
) &
BACK_PID=$!

echo "🌐 Starting Vite frontend dev server..."
(cd "$FRONTEND_DIR" && "${FRONTEND_CMD[@]}") &
FRONT_PID=$!

echo "💡 Frontend running on http://127.0.0.1:5173 (React)"
echo "💡 API running on http://127.0.0.1:5000 (Flask)"
echo "   The backend will redirect http://127.0.0.1:5000 to the React dev server while this script runs."

wait $BACK_PID $FRONT_PID
