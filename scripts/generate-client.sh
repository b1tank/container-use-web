#! /usr/bin/env bash

set -e
set -x

PORT=8000

# Start Deno server in background
cd backend
PORT=$PORT deno run --allow-all main.ts &
SERVER_PID=$!

# Wait a bit for server to start
sleep 2

# Fetch OpenAPI JSON
curl -s http://localhost:$PORT/api/v1/doc > openapi.json

# Kill the server
kill $SERVER_PID

# Continue the pipeline
cd ..
cp backend/openapi.json frontend/
cd frontend
pnpm run generate-client
npx biome format --write ./src/client
