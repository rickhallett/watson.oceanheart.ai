#!/bin/sh

# Ensure node_modules symlink exists
if [ ! -L "/app/frontend/node_modules" ]; then
    echo "Creating node_modules symlink..."
    ln -sf /app/node_modules /app/frontend/node_modules
fi

# Execute the passed command
exec "$@"