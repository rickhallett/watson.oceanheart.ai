#!/bin/bash
# Watson Health Check Script

set -e

# Check if Django application is responding
echo "🏥 Performing health check..."

# Test database connection
python manage.py check --database default >/dev/null 2>&1
if [[ $? -eq 0 ]]; then
    echo "✅ Database connection: OK"
else
    echo "❌ Database connection: FAILED"
    exit 1
fi

# Test HTTP response
if command -v curl >/dev/null 2>&1; then
    response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health/ || echo "000")
    if [[ $response -eq 200 ]]; then
        echo "✅ HTTP health endpoint: OK"
    else
        echo "❌ HTTP health endpoint: FAILED (${response})"
        exit 1
    fi
else
    echo "⚠️ curl not available, skipping HTTP check"
fi

# Test static files
if [[ -d /app/backend/staticfiles ]]; then
    echo "✅ Static files: OK"
else
    echo "❌ Static files: MISSING"
    exit 1
fi

# Test Ruby services (if needed)
if [[ -d /app/lib ]]; then
    echo "✅ Ruby services: Available"
fi

echo "🎉 Health check passed!"
exit 0