#!/bin/bash

# Watson Unified Development Server
# Starts both Django backend and Bun frontend concurrently

set -e

echo "🚀 Starting Watson Development Environment..."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to cleanup processes on exit
cleanup() {
    echo -e "\n${YELLOW}🛑 Shutting down development servers...${NC}"
    kill $(jobs -p) 2>/dev/null || true
    exit 0
}

# Trap Ctrl+C and other termination signals
trap cleanup INT TERM

# Load development environment variables
if [ -f .env.dev ]; then
    export $(cat .env.dev | grep -v '^#' | xargs)
    echo -e "${GREEN}✅ Loaded development environment variables${NC}"
else
    echo -e "${YELLOW}⚠️  No .env.dev file found, using default settings${NC}"
fi

echo ""
echo -e "${BLUE}📋 Services to start:${NC}"
echo -e "  • Django Backend (port 8000)"
echo -e "  • React Frontend (port 3000)"
echo ""

# Start Django backend in background
echo -e "${BLUE}🐍 Starting Django backend...${NC}"
cd backend
source ../.venv/bin/activate

# Check and run migrations
echo -e "${BLUE}🔄 Checking for pending migrations...${NC}"
python manage.py migrate --check || {
    echo -e "${YELLOW}📝 Running migrations...${NC}"
    python manage.py migrate
}

# Start Django development server
python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Start Bun frontend in background
echo -e "${BLUE}⚡ Starting Bun frontend...${NC}"
cd frontend
bun --hot ./index.ts &
FRONTEND_PID=$!
cd ..

# Wait for both services to start
sleep 3

echo ""
echo -e "${GREEN}🎉 Watson Development Environment Ready!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}📍 Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}📍 Backend API:${NC} http://localhost:8000"
echo -e "${BLUE}📍 Django Admin:${NC} http://localhost:8000/admin"
echo ""
echo -e "${YELLOW}🛑 Press Ctrl+C to stop all servers${NC}"
echo ""

# Keep script running and wait for background processes
wait $BACKEND_PID $FRONTEND_PID