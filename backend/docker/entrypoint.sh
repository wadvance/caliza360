#!/bin/sh
set -e

echo "Running Laravel migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
