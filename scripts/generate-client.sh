#! /usr/bin/env bash

set -e
set -x

PORT=8008

# Function to cleanup background processes
cleanup() {
  if [ ! -z "$SERVER_PID" ]; then
    kill -TERM $SERVER_PID 2>/dev/null || true
    wait $SERVER_PID 2>/dev/null || true
  fi
}

# Set trap to cleanup on script exit
trap cleanup EXIT

# Start Node.js server in background
cd backend
PORT=$PORT npx tsx src/index.ts &
SERVER_PID=$!

# Wait a bit for server to start
sleep 3

# Fetch OpenAPI JSON
curl -s http://localhost:$PORT/api/v1/doc > openapi.json

# Server will be killed by trap cleanup function

# Continue the pipeline
cd ..
cp backend/openapi.json frontend/
cd frontend
pnpm run generate-client
npx biome format --write ./src/client
