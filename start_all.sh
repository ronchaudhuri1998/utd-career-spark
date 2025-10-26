#!/usr/bin/env bash

# Launches FastAPI (backend) and Vite (frontend) dev servers together.
# Creates the backend virtualenv / installs deps and runs npm install
# on first run. Use CTRL+C to stop; both processes will be terminated.

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="${ROOT_DIR}/backend"
FRONTEND_DIR="${ROOT_DIR}/frontend"

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]]; then
    if kill -0 "${BACKEND_PID}" 2>/dev/null; then
      echo ""
      echo "Stopping backend (pid ${BACKEND_PID})..."
      kill "${BACKEND_PID}" >/dev/null 2>&1 || true
      wait "${BACKEND_PID}" 2>/dev/null || true
    fi
  fi
}
trap cleanup EXIT INT TERM

echo "==> Preparing backend environment..."
cd "${BACKEND_DIR}"

if [[ ! -d "venv" ]]; then
  echo "    Creating Python virtualenv (venv)..."
  python3 -m venv venv
fi

# shellcheck disable=SC1091
source "venv/bin/activate"

if [[ ! -f "venv/.deps_installed" ]]; then
  echo "    Installing backend dependencies..."
  pip install --upgrade pip >/dev/null
  pip install -r requirements.txt
  touch "venv/.deps_installed"
else
  echo "    Backend dependencies already installed (venv/.deps_installed)."
fi

echo "    Starting FastAPI server on http://localhost:8000 ..."
python run.py &
BACKEND_PID=$!

cd "${FRONTEND_DIR}"

echo "==> Preparing frontend environment..."
if [[ ! -d "node_modules" ]]; then
  echo "    Installing npm packages (first run)..."
  npm install
else
  echo "    node_modules present; skipping npm install."
fi

echo "    Starting Vite dev server on http://localhost:5173 ..."
echo "    (Press CTRL+C to stop both servers)"
npm run dev
