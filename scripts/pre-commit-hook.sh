#!/bin/bash

# Watson Testing Infrastructure - Pre-commit Hook
# Runs essential checks before allowing commits

set -e

echo "🔍 Pre-commit checks for Watson"
echo "==============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Change to project root
cd "$(dirname "$0")/.."

echo ""
echo "1. TypeScript Type Checking"
echo "---------------------------"
if bun run typecheck; then
    print_status "TypeScript types are valid"
else
    print_error "TypeScript type checking failed"
    echo "Please fix type errors before committing"
    exit 1
fi

echo ""
echo "2. Quick Test Suite"
echo "------------------"
# Run a subset of tests for speed
if bun test frontend/src/utils/validation.test.ts; then
    print_status "Frontend unit tests passed"
else
    print_error "Frontend tests failed"
    exit 1
fi

echo ""
echo "3. Django Model Tests"
echo "--------------------"
if (cd backend && DJANGO_ENVIRONMENT=test ../.venv/bin/python manage.py test core.test_models --verbosity=1); then
    print_status "Django core tests passed"
else
    print_error "Django tests failed"
    exit 1
fi

echo ""
echo "4. Ruby Validation Tests"
echo "-----------------------"
if bundle exec rspec spec/review_validator_spec.rb --format progress; then
    print_status "Ruby validation tests passed"
else
    print_error "Ruby tests failed"
    exit 1
fi

echo ""
print_status "Pre-commit checks completed successfully!"
echo ""
echo "✨ Ready to commit! All essential checks passed."