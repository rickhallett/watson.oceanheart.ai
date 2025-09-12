#!/bin/bash

# Watson Development Environment Health Check
# Verifies that all development dependencies and services are ready

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏥 Watson Development Environment Health Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

SUCCESS_COUNT=0
TOTAL_CHECKS=0

# Function to check and report status
check_status() {
    local name=$1
    local command=$2
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    printf "%-30s " "$name:"
    
    if eval "$command" &>/dev/null; then
        echo -e "${GREEN}✅ OK${NC}"
        SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
    else
        echo -e "${RED}❌ FAIL${NC}"
    fi
}

# Check Python and virtual environment
echo -e "\n${BLUE}🐍 Python Environment${NC}"
check_status "Virtual environment" "[ -d .venv ]"
check_status "Python executable" ".venv/bin/python --version"
check_status "Django installation" ".venv/bin/python -c 'import django'"
check_status "Django REST Framework" ".venv/bin/python -c 'import rest_framework'"

# Check Bun and Node dependencies
echo -e "\n${BLUE}⚡ Bun Environment${NC}"
check_status "Bun installation" "bun --version"
check_status "Node modules" "[ -d node_modules ]"
check_status "React installation" "[ -f node_modules/react/package.json ]"
check_status "TipTap installation" "[ -f node_modules/@tiptap/core/package.json ]"

# Check project structure
echo -e "\n${BLUE}📁 Project Structure${NC}"
check_status "Backend directory" "[ -d backend ]"
check_status "Frontend directory" "[ -d frontend ]"
check_status "Django project" "[ -f backend/manage.py ]"
check_status "Frontend entry point" "[ -f frontend/index.ts ]"

# Check configuration files
echo -e "\n${BLUE}⚙️  Configuration${NC}"
check_status "Django settings" "[ -f backend/watson/settings.py ]"
check_status "Package.json" "[ -f package.json ]"
check_status "Pyproject.toml" "[ -f pyproject.toml ]"
check_status "TypeScript config" "[ -f tsconfig.json ]"

# Check development scripts
echo -e "\n${BLUE}🛠️  Development Scripts${NC}"
check_status "Backend dev script" "[ -x scripts/dev-backend.sh ]"
check_status "Frontend dev script" "[ -x scripts/dev-frontend.sh ]"
check_status "Unified dev script" "[ -x scripts/dev.sh ]"
check_status "Environment file" "[ -f .env.dev ]"

# Database connectivity check
echo -e "\n${BLUE}💾 Database${NC}"
cd backend
if ./../.venv/bin/python manage.py migrate --check &>/dev/null; then
    echo -e "Database migrations     : ${GREEN}✅ OK${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo -e "Database migrations     : ${YELLOW}⚠️  Pending migrations detected${NC}"
fi
cd ..
TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

# Port availability check
echo -e "\n${BLUE}🔌 Port Availability${NC}"
if ! lsof -i :8000 &>/dev/null; then
    echo -e "Port 8000 (Django)      : ${GREEN}✅ Available${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo -e "Port 8000 (Django)      : ${YELLOW}⚠️  In use${NC}"
fi

if ! lsof -i :3000 &>/dev/null; then
    echo -e "Port 3000 (Frontend)    : ${GREEN}✅ Available${NC}"
    SUCCESS_COUNT=$((SUCCESS_COUNT + 1))
else
    echo -e "Port 3000 (Frontend)    : ${YELLOW}⚠️  In use${NC}"
fi
TOTAL_CHECKS=$((TOTAL_CHECKS + 2))

# Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 All checks passed! ($SUCCESS_COUNT/$TOTAL_CHECKS)${NC}"
    echo -e "${GREEN}Ready to start development with: ./scripts/dev.sh${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some checks failed: ($SUCCESS_COUNT/$TOTAL_CHECKS passed)${NC}"
    echo -e "${YELLOW}Please resolve the issues above before starting development${NC}"
    exit 1
fi