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

RUN curl -sS https://getcomposer.org/installer | php --install-dir=/usr/local/bin --filename=composer

WORKDIR /var/www

COPY . .

ENV COMPOSER_ALLOW_SUPERUSER=1

RUN composer install --no-dev --no-interaction --prefer-dist --optimize-autload \
  && php artisan config:clear || true

RUN mkdir -p /var/www/storage/framework/{sessions,views,cache} \
  && mkdir -p /var/www/bootstrap/cache \
  && chmod -R 777 /var/www/storage /var/www/bootstrap/cache

COPY ./docker/nginx.conf /etc/nginx/nginx.conf
COPY ./docker/supervisord.conf /etc/supervisord.conf
COPY ./docker/www.conf /usr/local/etc/php-fpm.d/zz-www.conf
COPY ./docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]