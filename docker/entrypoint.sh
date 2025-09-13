#!/bin/bash
# Watson Docker Entrypoint Script

set -e

echo "🚀 Starting Watson Application"
echo "================================"

# Wait for database to be ready
echo "📊 Waiting for database connection..."
python manage.py check --database default

# Run database migrations
echo "🔄 Running database migrations..."
python manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
python manage.py collectstatic --noinput --clear

# Create superuser if specified
if [[ $DJANGO_SUPERUSER_EMAIL ]]; then
    echo "👤 Creating superuser..."
    python manage.py createsuperuser \
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