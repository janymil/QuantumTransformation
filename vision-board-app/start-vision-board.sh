#!/bin/bash

# Vision Board App Startup Script
# Runs the Vision Board server independently on port 3001

cd "$(dirname "$0")"

# Kill any existing Vision Board processes
pkill -f "node server/index.js"

# Wait for processes to terminate
sleep 2

# Start the Vision Board server
echo "Starting Vision Board server on port 3001..."
PORT=3001 nohup node server/index.js > vision-board.log 2>&1 &

# Store process ID
echo $! > vision-board.pid

# Wait a moment for server to start
sleep 3

# Test if server is running
if curl -s "http://localhost:3001/health" > /dev/null; then
    echo "✅ Vision Board server is running successfully!"
    echo "🔗 Access at: http://localhost:3001"
    echo "📋 Process ID: $(cat vision-board.pid)"
else
    echo "❌ Vision Board server failed to start"
    cat vision-board.log
    exit 1
fi