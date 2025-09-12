#!/bin/bash

# Watson Backend Development Server
# Starts Django development server with hot reload

set -e

echo "🚀 Starting Watson Backend Development Server..."

# Load development environment variables
if [ -f .env.dev ]; then
    export $(cat .env.dev | grep -v '^#' | xargs)
    echo "✅ Loaded development environment variables"
else
    echo "⚠️  No .env.dev file found, using default settings"
fi

# Navigate to backend directory
cd backend

# Activate virtual environment
source ../.venv/bin/activate

# Run migrations if needed
echo "🔄 Checking for pending migrations..."
python manage.py migrate --check || {
    echo "📝 Running migrations..."
    python manage.py migrate
}

# Start development server with hot reload
echo "🔥 Starting Django development server with hot reload..."
echo "📍 Server will be available at: http://localhost:8000"
echo "🛑 Press Ctrl+C to stop the server"
echo ""

python manage.py runserver 0.0.0.0:8000