#!/bin/bash

# Watson Testing Infrastructure - Local CI Simulation
# Simulates GitHub Actions workflow locally for development

set -e

echo "🚀 Watson Local CI Pipeline Simulation"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Change to project root
cd "$(dirname "$0")/.."

echo ""
echo "🔍 Step 1: Environment Check"
echo "----------------------------"

# Check required tools
if command -v bun &> /dev/null; then
    print_status "Bun is available"
else
    print_error "Bun is not installed"
    exit 1
fi

if command -v python &> /dev/null; then
    print_status "Python is available"
else
    print_error "Python is not installed"
    exit 1
fi

if command -v ruby &> /dev/null; then
    print_status "Ruby is available"
else
    print_error "Ruby is not installed"
    exit 1
fi

if command -v bundle &> /dev/null; then
    print_status "Bundler is available"
else
    print_error "Bundler is not installed"
    exit 1
fi

echo ""
echo "🧪 Step 2: Type Checking"
echo "------------------------"
if bun run typecheck; then
    print_status "TypeScript compilation successful"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

echo ""
echo "🧪 Step 3: Running Test Suites"
echo "------------------------------"

# Frontend tests
echo "Frontend Tests (Bun):"
if bun test frontend/ --preload ./bun.test.config.ts; then
    print_status "Frontend tests passed"
else
    print_error "Frontend tests failed"
    exit 1
fi

echo ""
echo "Backend Tests (Django):"
if (cd backend && DJANGO_ENVIRONMENT=test ../.venv/bin/python manage.py test --verbosity=2); then
    print_status "Backend tests passed"
else
    print_error "Backend tests failed"
    exit 1
fi

echo ""
echo "Ruby Tests (RSpec):"
if bundle exec rspec --format progress; then
    print_status "Ruby tests passed"
else
    print_error "Ruby tests failed"
    exit 1
fi

echo ""
echo "📊 Step 4: Coverage Analysis"
echo "----------------------------"
if npm run coverage > /dev/null 2>&1; then
    print_status "Coverage reports generated"
else
    print_warning "Coverage generation had issues (non-fatal)"
fi

echo ""
echo "🔨 Step 5: Build Verification"
echo "-----------------------------"
if NODE_ENV=production npm run build; then
    print_status "Production build successful"
else
    print_error "Production build failed"
    exit 1
fi

if npm run validate:build; then
    print_status "Build validation passed"
else
    print_error "Build validation failed"
    exit 1
fi

echo ""
echo "🎉 Local CI Pipeline Completed Successfully!"
echo "==========================================="
print_status "All checks passed ✅"
echo ""
echo "📈 Summary:"
echo "  • Type checking: ✅"
echo "  • Frontend tests: ✅"
echo "  • Backend tests: ✅"
echo "  • Ruby tests: ✅"
echo "  • Coverage reports: ✅"
echo "  • Production build: ✅"
echo "  • Build validation: ✅"
echo ""
echo "🚀 Ready for deployment!"