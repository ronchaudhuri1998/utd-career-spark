#!/bin/bash

# Startup script for UTD Career Spark API
echo "Starting UTD Career Spark API..."

# Debug: Check Python and uvicorn availability
echo "Checking Python installation..."
which python3
python3 --version

echo "Checking pip and installed packages..."
pip3 list | grep uvicorn

echo "Checking uvicorn installation..."
python3 -c "import uvicorn; print('uvicorn version:', uvicorn.__version__)" || echo "uvicorn not found"

# Wait a moment for environment to be ready
sleep 2

# Start the application
echo "Starting uvicorn server..."
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info
