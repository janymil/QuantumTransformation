
#!/bin/bash

echo "🧪 Fast Journaling System Test Runner"
echo "======================================"

# Check if Node.js is available
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Navigate to dev-scripts directory
cd "$(dirname "$0")"

echo "📍 Current directory: $(pwd)"
echo "📦 Installing dependencies..."

# Run the test
echo "🚀 Starting tests..."
node test-fast-journaling.js

echo "✅ Test execution completed!"
