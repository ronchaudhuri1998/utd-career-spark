#!/bin/bash

# Startup script for UTD Career Spark API
echo "Starting UTD Career Spark API..."

# Wait a moment for environment to be ready
sleep 2

# Start the application
exec python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --workers 1 --log-level info
