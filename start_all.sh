#!/usr/bin/env bash

# Unified launcher for the FastAPI backend and Vite frontend.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$ROOT_DIR/backend"
BACKEND_CMD=("uvicorn" "main:app" "--host" "0.0.0.0" "--port" "8000" "--reload")
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

echo "📦 Checking and installing dependencies..."

# Check and install frontend dependencies
if [[ ! -d "$FRONTEND_DIR/node_modules" ]]; then
    echo "➡️  Installing frontend dependencies (npm install)..."
    (cd "$FRONTEND_DIR" && npm install)
else
    echo "➡️  Updating frontend dependencies (npm install)..."
    (cd "$FRONTEND_DIR" && npm install)
fi

# Check and install backend dependencies
if [[ ! -f "$BACKEND_DIR/requirements.txt" ]]; then
    echo "⚠️  Missing backend/requirements.txt. Please verify your backend folder."
else
    echo "➡️  Installing backend dependencies (pip install)..."
    (cd "$BACKEND_DIR" && source .venv/bin/activate && pip install -r requirements.txt)
fi

PORT=8000
if PIDS=$(lsof -ti:"$PORT" 2>/dev/null); then
    if [[ -n "$PIDS" ]]; then
        echo "🧹 Clearing port $PORT (PIDs: $PIDS)..."
        echo "$PIDS" | xargs -r kill
        sleep 1
    fi
fi

echo "🚀 Starting FastAPI backend with uvicorn..."
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

echo "💡 Frontend running on http://127.0.0.1:5173 (React + Vite)"
echo "💡 API running on http://127.0.0.1:8000 (FastAPI + AWS AgentCore)"
echo "   Backend powered by AWS Bedrock AgentCore multi-agent system"

wait $BACK_PID $FRONT_PID
