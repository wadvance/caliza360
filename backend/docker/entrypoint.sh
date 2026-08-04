#!/bin/sh
set -e

echo "Preparing storage..."
mkdir -p storage/framework/sessions storage/framework/views storage/framework/cache \
  && chmod -R 777 storage bootstrap/cache

echo "Setting APP_KEY..."
if [ -z "$APP_KEY" ]; then
  php artisan key:generate --force
fi

echo "Running Laravel migrations..."
php artisan migrate --force || echo "Migration failed, continuing..."

echo "Seeding database if empty..."
if [ "$(php artisan tinker --execute="echo \App\Models\User::count();" 2>/dev/null || echo 'x')" = "0" ]; then
  php artisan db:seed --force || echo "Seed failed, continuing..."
else
  echo "Database already has users, skipping seed."
fi

echo "Starting services..."
exec /usr/bin/supervisord -c /etc/supervisord.conf
