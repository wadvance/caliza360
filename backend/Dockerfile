FROM php:8.3-fpm-alpine

RUN apk add --no-cache \
    nginx \
    supervisor \
    bash \
    curl \
    git \
    unzip \
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

RUN curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www

COPY . .

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autoloader \
  && php artisan config:clear || true

RUN mkdir -p storage/framework/{sessions,views,cache} \
  && chmod -R 777 storage bootstrap/cache

# Copiar archivos de configuración desde el directorio ya copiado
RUN cp docker/nginx.conf /etc/nginx/nginx.conf \
  && cp docker/supervisord.conf /etc/supervisord.conf \
  && cp docker/www.conf /usr/local/etc/php-fpm.d/zz-www.conf \
  && cp docker/entrypoint.sh /entrypoint.sh \
  && chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
