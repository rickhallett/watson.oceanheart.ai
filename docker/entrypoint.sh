#!/bin/bash
# Watson Docker Entrypoint Script

set -e

echo "🚀 Starting Watson Application"
echo "================================"

# Ensure venv binaries are preferred
export PATH="/app/backend/.venv/bin:$PATH"
VENV_PY="/app/backend/.venv/bin/python"

# Wait for database to be ready
echo "📊 Waiting for database connection..."
cd /app/backend
"$VENV_PY" manage.py check --database default

# Run database migrations
echo "🔄 Running database migrations..."
"$VENV_PY" manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
"$VENV_PY" manage.py collectstatic --noinput --clear

# Create superuser if specified
if [[ $DJANGO_SUPERUSER_EMAIL ]]; then
    echo "👤 Creating superuser..."
    "$VENV_PY" manage.py createsuperuser \
        --noinput \
        --username $DJANGO_SUPERUSER_USERNAME \
        --email $DJANGO_SUPERUSER_EMAIL || true
fi

# Run any additional setup commands
if [[ -f /app/scripts/setup.sh ]]; then
    echo "⚙️ Running additional setup..."
    bash /app/scripts/setup.sh
fi

echo "✅ Watson application ready!"
echo ""

# Execute the main command
exec "$@"
