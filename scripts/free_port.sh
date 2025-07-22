#!/bin/bash

# Check if port argument is provided
if [ $# -eq 0 ]; then
    echo "❌ Usage: $0 <port>"
    echo "   Example: $0 5173"
    exit 1
fi

PORT=$1

# Validate that the port is a number
if ! [[ "$PORT" =~ ^[0-9]+$ ]]; then
    echo "❌ Error: Port must be a number"
    exit 1
fi

echo "🔍 Checking for processes listening on port $PORT..."

# Find processes listening on the specified port
pids=$(lsof -iTCP:$PORT -sTCP:LISTEN -t 2>/dev/null)

if [ -z "$pids" ]; then
    echo "✅ No processes found listening on port $PORT. Nothing to kill!"
    exit 0
fi

echo "🎯 Found process(es) with PID(s): $pids"
echo "🔪 Killing process(es)..."

if kill $pids 2>/dev/null; then
    echo "✅ Successfully killed process(es) on port $PORT!"
else
    echo "❌ Failed to kill some or all processes. They might have already exited."
    exit 1
fi

echo "🎉 Port $PORT is now free!"
