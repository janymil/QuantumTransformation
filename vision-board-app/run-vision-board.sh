#!/bin/bash

# Simple Vision Board launcher that works in Replit
echo "Vision Board Server starting on port 3001"
echo "Access at: http://localhost:3001"

cd "$(dirname "$0")"
exec node simple-server.cjs