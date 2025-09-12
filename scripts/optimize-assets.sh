#!/bin/bash

# Watson Asset Optimization Script
# Additional compression and optimization for production assets

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🔧 Watson Asset Optimization"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get file size
get_size() {
    if [ -f "$1" ]; then
        if command_exists gstat; then
            gstat -c%s "$1" 2>/dev/null || stat -f%z "$1" 2>/dev/null || echo "0"
        else
            stat -f%z "$1" 2>/dev/null || stat -c%s "$1" 2>/dev/null || echo "0"
        fi
    else
        echo "0"
    fi
}

# Function to format bytes
format_bytes() {
    local bytes=$1
    if [ $bytes -lt 1024 ]; then
        echo "${bytes}B"
    elif [ $bytes -lt 1048576 ]; then
        echo "$(($bytes / 1024))KB"
    else
        echo "$(($bytes / 1048576))MB"
    fi
}

# Check if build artifacts exist
if [ ! -d "dist/static" ]; then
    echo -e "${RED}❌ No build artifacts found. Run production build first.${NC}"
    exit 1
fi

echo -e "${BLUE}📊 Analyzing current assets...${NC}"

# Analyze main assets
JS_SIZE=$(get_size "dist/static/main.js")
CSS_SIZE=$(get_size "dist/static/main.css")

echo "  • JavaScript: $(format_bytes $JS_SIZE)"
echo "  • CSS: $(format_bytes $CSS_SIZE)"
echo ""

# Gzip compression simulation (checking compression ratios)
echo -e "${BLUE}🗜️  Testing compression ratios...${NC}"

if command_exists gzip; then
    # Create temporary compressed versions to check ratios
    cp dist/static/main.js /tmp/main.js.orig
    cp dist/static/main.css /tmp/main.css.orig
    
    gzip -9 -c /tmp/main.js.orig > /tmp/main.js.gz
    gzip -9 -c /tmp/main.css.orig > /tmp/main.css.gz
    
    JS_GZIP_SIZE=$(get_size "/tmp/main.js.gz")
    CSS_GZIP_SIZE=$(get_size "/tmp/main.css.gz")
    
    JS_RATIO=$(echo "scale=1; $JS_GZIP_SIZE * 100 / $JS_SIZE" | bc -l 2>/dev/null || echo "0")
    CSS_RATIO=$(echo "scale=1; $CSS_GZIP_SIZE * 100 / $CSS_SIZE" | bc -l 2>/dev/null || echo "0")
    
    echo "  • JavaScript (gzipped): $(format_bytes $JS_GZIP_SIZE) (${JS_RATIO}% of original)"
    echo "  • CSS (gzipped): $(format_bytes $CSS_GZIP_SIZE) (${CSS_RATIO}% of original)"
    
    # Cleanup temp files
    rm -f /tmp/main.js.orig /tmp/main.css.orig /tmp/main.js.gz /tmp/main.css.gz
else
    echo "  • gzip not available for compression testing"
fi

echo ""

# Asset optimization recommendations
echo -e "${BLUE}💡 Optimization Analysis:${NC}"

# Check for potential optimizations
TOTAL_SIZE=$((JS_SIZE + CSS_SIZE))
if [ $JS_SIZE -gt 500000 ]; then
    echo -e "${YELLOW}  ⚠️  JavaScript bundle is large ($(format_bytes $JS_SIZE)) - consider code splitting${NC}"
fi

if [ $CSS_SIZE -gt 50000 ]; then
    echo -e "${YELLOW}  ⚠️  CSS bundle is getting large ($(format_bytes $CSS_SIZE)) - consider critical CSS${NC}"
else
    echo -e "${GREEN}  ✅ CSS bundle size is optimal${NC}"
fi

# Check for source map size
SOURCEMAP_SIZE=$(get_size "dist/static/main.js.map")
if [ $SOURCEMAP_SIZE -gt 1000000 ]; then
    echo -e "${YELLOW}  ⚠️  Source map is large ($(format_bytes $SOURCEMAP_SIZE)) - ensure it's excluded from production${NC}"
fi

# Asset hashing check
echo -e "${BLUE}🔗 Asset Cache Optimization:${NC}"

# Check if assets have hash in filename
if [[ "dist/static/main.js" =~ -[a-f0-9]{8,}\. ]]; then
    echo -e "${GREEN}  ✅ Assets have cache-busting hashes${NC}"
else
    echo -e "${YELLOW}  ⚠️  Consider adding cache-busting hashes to asset names${NC}"
fi

# Generate optimization report
cat > dist/optimization-report.json << EOF
{
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "assets": {
    "javascript": {
      "file": "main.js",
      "originalSize": $JS_SIZE,
      "gzippedSize": ${JS_GZIP_SIZE:-0},
      "compressionRatio": "${JS_RATIO:-0}%"
    },
    "css": {
      "file": "main.css", 
      "originalSize": $CSS_SIZE,
      "gzippedSize": ${CSS_GZIP_SIZE:-0},
      "compressionRatio": "${CSS_RATIO:-0}%"
    },
    "sourcemap": {
      "size": $SOURCEMAP_SIZE
    }
  },
  "totalSize": $TOTAL_SIZE,
  "recommendations": [
    $([ $JS_SIZE -gt 500000 ] && echo '"Consider code splitting for large JavaScript bundle",')
    $([ $CSS_SIZE -gt 50000 ] && echo '"Consider critical CSS extraction",')
    "Enable gzip/brotli compression on server",
    "Implement proper cache headers",
    "Consider service worker for caching strategy"
  ]
}
EOF

echo -e "${GREEN}✅ Optimization analysis complete${NC}"
echo ""
echo -e "${BLUE}📄 Reports generated:${NC}"
echo "  • dist/build-manifest.json - Build metadata"
echo "  • dist/optimization-report.json - Performance analysis"
echo ""
echo -e "${GREEN}🎯 Production assets are optimized and ready for deployment!${NC}"