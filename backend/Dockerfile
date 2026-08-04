FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    bash \
    curl \
    git \
    unzip \
    ca-certificates \
    libzip-dev \
    icu-dev \
    oniguruma-dev \
    postgresql-dev \
    $PHPIZE_DEPS \
  && docker-php-ext-install \
    pdo_mysql \
    pdo_pgsql \
    mbstring \
    zip \
    intl \
    bcmath \
    fileinfo \
  && docker-php-ext-enable opcache

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www

COPY backend/ .

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader --no-scripts

RUN cp .env.example .env 2>/dev/null || echo "APP_KEY=" > .env
RUN php artisan key:generate --force || true
RUN php artisan package:discover --ansi || true
RUN php artisan config:clear || true

RUN mkdir -p storage/framework/{sessions,views,cache} \
  && mkdir -p bootstrap/cache \
  && chmod -R 777 storage bootstrap/cache

COPY backend/docker/nginx.conf /etc/nginx/nginx.conf
COPY backend/docker/supervisord.conf /etc/supervisord.conf
COPY backend/docker/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY backend/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
