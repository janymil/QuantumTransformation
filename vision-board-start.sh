#!/bin/bash

# Vision Board Server Startup Script
echo "🚀 Starting Vision Board Server..."

# Change to vision board directory
cd vision-board-app

# Kill any existing processes on port 3001
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the persistent server
PORT=3001 node persistent-server.js