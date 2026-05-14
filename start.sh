#!/bin/bash

# Ensure we have execution permissions for this script
# (Though you might need to run 'chmod +x start.sh' manually the first time)

echo "[1/2] Starting Database..."
docker-compose up -d db

echo "[2/2] Starting All Services..."
# Note: Ensure you have run 'npm install' and your environment is set up.
npm run dev
