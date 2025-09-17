#!/bin/bash

# Watson Frontend Development Server
# Starts Bun development server with HMR

set -e

echo "🚀 Starting Watson Frontend Development Server..."

# Load development environment variables
if [ -f .env.dev ]; then
    export $(cat .env.dev | grep -v '^#' | xargs)
    echo "✅ Loaded development environment variables"
else
    echo "⚠️  No .env.dev file found, using default settings"
fi

# Navigate to frontend directory
cd frontend

# Start Bun development server with HMR
echo "🔥 Starting Bun development server with Hot Module Reloading..."
echo "📍 Frontend will be available at: http://localhost:3001"
echo "🔗 API proxy to Django backend at: http://localhost:8001"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

bun run dev -- --port 3001
