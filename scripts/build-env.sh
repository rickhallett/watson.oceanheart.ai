#!/bin/bash

# Watson Environment-Specific Build Script
# Builds for different deployment environments

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default to staging if no environment specified
ENVIRONMENT=${1:-staging}

echo "🏗️  Watson Environment Build: $ENVIRONMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Validate environment
case $ENVIRONMENT in
  development|dev)
    ENV_FILE=".env.dev"
    OPTIMIZE_LEVEL="basic"
    INCLUDE_SOURCEMAPS=true
    ;;
  staging|stage)
    ENV_FILE=".env.staging"
    OPTIMIZE_LEVEL="full"
    INCLUDE_SOURCEMAPS=true
    ;;
  production|prod)
    ENV_FILE=".env.production"
    OPTIMIZE_LEVEL="aggressive"
    INCLUDE_SOURCEMAPS=false
    ;;
  *)
    echo -e "${RED}❌ Invalid environment: $ENVIRONMENT${NC}"
    echo "Usage: $0 [development|staging|production]"
    exit 1
    ;;
esac

echo -e "${BLUE}📋 Build Configuration:${NC}"
echo "  • Environment: $ENVIRONMENT"
echo "  • Config file: $ENV_FILE"
echo "  • Optimization: $OPTIMIZE_LEVEL"
echo "  • Source maps: $INCLUDE_SOURCEMAPS"
echo ""

# Check if environment file exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}❌ Environment file $ENV_FILE not found${NC}"
    exit 1
fi

# Load environment variables
echo -e "${BLUE}📥 Loading environment configuration...${NC}"
export $(cat $ENV_FILE | grep -v '^#' | xargs)
export NODE_ENV=$ENVIRONMENT

# Set build-specific variables
export OPTIMIZE_LEVEL
export INCLUDE_SOURCEMAPS

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous build artifacts...${NC}"
rm -rf dist build backend/staticfiles

# Create build directories
mkdir -p dist/static dist/assets backend/static/dist

# Build frontend with environment-specific optimizations
echo -e "${BLUE}⚡ Building frontend for $ENVIRONMENT...${NC}"

BUN_BUILD_CMD="bun build ./frontend/src/main.tsx --outdir ./dist/static --minify --splitting --format esm --target browser --public-path /static/"

# Add source maps conditionally
if [ "$INCLUDE_SOURCEMAPS" = true ]; then
    BUN_BUILD_CMD="$BUN_BUILD_CMD --sourcemap=linked"
    echo -e "${YELLOW}  📍 Including source maps${NC}"
else
    echo -e "${GREEN}  🔒 Source maps excluded for security${NC}"
fi

# Environment-specific optimizations
case $OPTIMIZE_LEVEL in
  aggressive)
    BUN_BUILD_CMD="$BUN_BUILD_CMD --define process.env.NODE_ENV='\"production\"' --define process.env.DEBUG='\"false\"'"
    echo -e "${GREEN}  🚀 Aggressive optimization enabled${NC}"
    ;;
  full)
    BUN_BUILD_CMD="$BUN_BUILD_CMD --define process.env.NODE_ENV='\"staging\"'"
    echo -e "${BLUE}  ⚡ Full optimization enabled${NC}"
    ;;
  basic)
    echo -e "${YELLOW}  ⚙️  Basic optimization${NC}"
    ;;
esac

# Execute build
eval $BUN_BUILD_CMD

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Frontend build completed${NC}"
else
    echo -e "${RED}❌ Frontend build failed${NC}"
    exit 1
fi

# Copy HTML template
echo -e "${BLUE}📄 Processing HTML template...${NC}"
cp frontend/index.html dist/
echo -e "${GREEN}✅ HTML template copied${NC}"

# Django static collection
echo -e "${BLUE}🐍 Collecting Django static files...${NC}"
cd backend
source ../.venv/bin/activate

# Use environment-specific Django settings
export DJANGO_SETTINGS_MODULE=watson.settings
../.venv/bin/python manage.py collectstatic --noinput --clear

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Django static collection completed${NC}"
else
    echo -e "${RED}❌ Django static collection failed${NC}"
    exit 1
fi

# Copy frontend assets to Django
cp -r ../dist/static/* staticfiles/
cd ..

# Generate environment-specific build manifest
echo -e "${BLUE}📄 Generating build manifest...${NC}"
cat > dist/build-manifest.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'development')",
  "environment": "$ENVIRONMENT",
  "optimizationLevel": "$OPTIMIZE_LEVEL",
  "sourceMaps": $INCLUDE_SOURCEMAPS,
  "assets": {
    "frontend": "$(find dist/static -name "*.js" | head -1 | xargs basename 2>/dev/null || echo 'main.js')",
    "css": "$(find dist/static -name "*.css" | head -1 | xargs basename 2>/dev/null || echo 'main.css')"
  },
  "buildConfig": {
    "nodeEnv": "$NODE_ENV",
    "minified": true,
    "codeSplitting": true,
    "envFile": "$ENV_FILE"
  }
}
EOF

# Run build validation
echo -e "${BLUE}🔍 Validating build artifacts...${NC}"
node scripts/validate-build.js

VALIDATION_RESULT=$?

# Final summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if [ $VALIDATION_RESULT -eq 0 ]; then
    echo -e "${GREEN}🎉 Build completed successfully for $ENVIRONMENT!${NC}"
    echo ""
    echo -e "${BLUE}📊 Build Summary:${NC}"
    echo "  • Environment: $ENVIRONMENT"
    echo "  • Frontend bundle: $(find dist/static -name "*.js" -exec du -h {} \; | cut -f1)"
    echo "  • CSS bundle: $(find dist/static -name "*.css" -exec du -h {} \; | cut -f1)"
    echo "  • Total static files: $(find backend/staticfiles -type f | wc -l)"
    echo ""
    echo -e "${GREEN}🚀 Ready for deployment to $ENVIRONMENT!${NC}"
    exit 0
else
    echo -e "${RED}❌ Build validation failed for $ENVIRONMENT${NC}"
    echo "Please review validation warnings before deployment."
    exit 1
fi