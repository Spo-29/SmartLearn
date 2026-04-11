# Use an official PHP image with Apache
FROM php:8.2-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    curl \
    default-mysql-client \
    libjpeg62-turbo-dev \
    libfreetype6-dev \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip

# Install Node.js 18
RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
    apt-get install -y nodejs

# Enable mod_rewrite
RUN a2enmod rewrite

# Clear cache
RUN apt-get clean && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-configure gd --with-freetype --with-jpeg && \
    docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# Remove PHP upload size limits so course cover uploads are not capped by PHP.
RUN { \
    echo "upload_max_filesize=0"; \
    echo "post_max_size=0"; \
    echo "max_execution_time=0"; \
    echo "max_input_time=0"; \
    echo "memory_limit=512M"; \
} > /usr/local/etc/php/conf.d/uploads.ini

# By default, Apache serves files from /var/www/html.
# Laravel expects the document root to point to the public directory of its project structure for proper routing and security.
# These commands update Apache’s configuration so that it serves files from /var/www/html/public instead, aligning it with Laravel's structure.
ENV APACHE_DOCUMENT_ROOT=/var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Get latest Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy the application code to the html folder
# COPY . /var/www/html

# Copy Laravel backend code
COPY server/ /var/www/html
COPY client/ /var/www/html/client
COPY database/ /var/www/html/database
COPY scripts/render-db-init.sh /var/www/html/scripts/render-db-init.sh
COPY server/docker-start.sh /usr/local/bin/docker-start.sh

# Set working directory
WORKDIR /var/www/html

# Install Laravel dependencies
RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader

# Set permissions for Laravel storage and cache
RUN chown -R www-data:www-data /var/www/html && chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
RUN chmod +x /var/www/html/scripts/render-db-init.sh /usr/local/bin/docker-start.sh

# RUN ls -a
# RUN echo "hello wrld"

ARG VITE_BACKEND_ENDPOINT=http://localhost:9000
RUN printf "VITE_BACKEND_ENDPOINT=%s\n" "$VITE_BACKEND_ENDPOINT" > /var/www/html/client/.env.production
RUN cd client && npm ci && npm run build

# # Move React build to Laravel public directory
RUN cp -r client/dist/* public/

# # Expose port 80 for Apache
EXPOSE 80

CMD ["/usr/local/bin/docker-start.sh"]
