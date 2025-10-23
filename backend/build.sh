#!/bin/bash

# App Runner build script
set -e

echo "Starting build process..."

# Update pip and install build tools
echo "Updating pip and build tools..."
python3 -m pip install --upgrade pip setuptools wheel

# Install dependencies with retry logic
echo "Installing Python dependencies..."
python3 -m pip install --no-cache-dir -r requirements.txt

# Verify installation
echo "Verifying installation..."
python3 -c "import fastapi, uvicorn, boto3, bedrock_agentcore; print('All core dependencies imported successfully')"

echo "Build completed successfully!"
