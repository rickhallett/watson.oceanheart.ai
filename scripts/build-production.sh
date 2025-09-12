#!/bin/bash

# Watson Production Build Script
# Creates optimized build artifacts for deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🏗️  Watson Production Build"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Set production environment
export NODE_ENV=production

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $1${NC}"
    else
        echo -e "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Clean previous builds
echo -e "${BLUE}🧹 Cleaning previous build artifacts...${NC}"
rm -rf dist build backend/static/dist backend/staticfiles
check_success "Clean completed"

# Create output directories
echo -e "${BLUE}📁 Creating build directories...${NC}"
mkdir -p dist/static dist/assets backend/static/dist
check_success "Directories created"

# TypeScript type checking (frontend only)
echo -e "${BLUE}🔍 Running TypeScript type checking...${NC}"
cd frontend && bun tsc --noEmit src/**/*.tsx src/**/*.ts || echo -e "${YELLOW}⚠️  TypeScript warnings (non-blocking)${NC}"
cd ..

# Build frontend with Bun
echo -e "${BLUE}⚡ Building frontend with Bun optimization...${NC}"
bun build ./frontend/src/main.tsx \
    --outdir ./dist/static \
    --minify \
    --splitting \
    --format esm \
    --target browser \
    --public-path /static/ \
    --sourcemap=linked \
    --define process.env.NODE_ENV='"production"'
check_success "Frontend build"

# Build additional assets
echo -e "${BLUE}🖼️  Processing static assets...${NC}"
# Copy HTML template with hashed asset names
cp frontend/index.html dist/
# Copy any additional static assets
if [ -d "frontend/public" ]; then
    cp -r frontend/public/* dist/static/ 2>/dev/null || true
fi
check_success "Static assets processed"

# Django static file collection
echo -e "${BLUE}🐍 Collecting Django static files...${NC}"
cd backend
source ../.venv/bin/activate

# Ensure Django can find static files
export DJANGO_SETTINGS_MODULE=watson.settings
../.venv/bin/python manage.py collectstatic --noinput --clear
check_success "Django static collection"

# Copy built frontend assets to Django static
echo -e "${BLUE}🔄 Copying frontend assets to Django static...${NC}"
cp -r ../dist/static/* staticfiles/
check_success "Asset copying"

cd ..

# Generate build manifest
echo -e "${BLUE}📄 Generating build manifest...${NC}"
cat > dist/build-manifest.json << EOF
{
  "buildTime": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "version": "$(git rev-parse HEAD 2>/dev/null || echo 'development')",
  "environment": "production",
  "assets": {
    "frontend": "$(find dist/static -name "*.js" | head -1 | xargs basename 2>/dev/null || echo 'main.js')",
    "css": "$(find dist/static -name "*.css" | head -1 | xargs basename 2>/dev/null || echo 'none')"
  },
  "buildConfig": {
    "nodeEnv": "$NODE_ENV",
    "minified": true,
    "sourceMaps": true,
    "codeSplitting": true
  }
}
EOF
check_success "Build manifest generated"

# Validate build artifacts
echo -e "${BLUE}🔎 Validating build artifacts...${NC}"

# Check if main files exist
if [ ! -f "dist/index.html" ]; then
    echo -e "${RED}❌ Missing index.html${NC}"
    exit 1
fi

JS_FILES=$(find dist/static -name "*.js" | wc -l)
if [ "$JS_FILES" -eq 0 ]; then
    echo -e "${RED}❌ No JavaScript files generated${NC}"
    exit 1
fi

DJANGO_STATIC=$(find backend/staticfiles -type f | wc -l)
if [ "$DJANGO_STATIC" -eq 0 ]; then
    echo -e "${RED}❌ Django static files not collected${NC}"
    exit 1
fi

check_success "Build validation"

# Generate build summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}🎉 Production Build Complete!${NC}"
echo ""
echo -e "${BLUE}📊 Build Summary:${NC}"
echo "  • Frontend JS files: $JS_FILES"
echo "  • Django static files: $DJANGO_STATIC"
echo "  • Build artifacts: dist/"
echo "  • Django static: backend/staticfiles/"
echo ""
echo -e "${BLUE}🚀 Ready for deployment!${NC}"
echo "  • Frontend assets: dist/static/"
echo "  • Backend static: backend/staticfiles/"
echo "  • Build manifest: dist/build-manifest.json"
echo ""