#!/bin/bash
# Watson Docker Entrypoint Script

set -e

echo "🚀 Starting Watson Application"
echo "================================"

# Ensure venv binaries are preferred
export PATH="/app/backend/.venv/bin:$PATH"
VENV_PY="/app/backend/.venv/bin/python"
if [ ! -x "$VENV_PY" ]; then
  echo "⚠️  Venv python not found at $VENV_PY, using system python"
  VENV_PY="python"
fi

cd /app/backend

# --- NEW: Wait-for-it loop ---
# This loop will attempt to connect to the database until it succeeds.
echo "📊 Waiting for database to be ready..."
until "$VENV_PY" manage.py check --database default; do
  >&2 echo "Postgres is unavailable - sleeping"
  sleep 1
done
>&2 echo "Postgres is up - continuing..."
# --- END NEW ---

# Run database migrations
echo "🔄 Running database migrations..."
"$VENV_PY" manage.py migrate --noinput

# Collect static files
echo "📁 Collecting static files..."
"$VENV_PY" manage.py collectstatic --noinput --clear --verbosity 0

# Create superuser if specified
if [[ $DJANGO_SUPERUSER_EMAIL ]]; then
    echo "👤 Creating superuser..."
    "$VENV_PY" manage.py createsuperuser \
        --noinput \
        --username $DJANGO_SUPERUSER_USERNAME \
        --email $DJANGO_SUPERUSER_EMAIL || true
fi

echo "✅ Watson application setup complete!"
echo ""

# Execute the main command passed to the container
exec "$@"