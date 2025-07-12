#!/bin/bash

# Database initialization script for Docker
set -e

echo "Waiting for MySQL to be ready..."
while ! mysqladmin ping -h"$DB_HOST" -u"$DB_USER" -p"$DB_PASSWORD" --silent; do
    sleep 1
done

echo "MySQL is ready. Running migrations..."

# Set DATABASE_URL for production
export DATABASE_URL="mysql://$DB_USER:$DB_PASSWORD@$DB_HOST:$DB_PORT/$DB_NAME"

# Run migrations
npx sequelize-cli db:migrate --env production

echo "Database migrations completed successfully!"

# Optional: Run seeders if they exist
if [ -d "./seeders" ] && [ "$(ls -A ./seeders)" ]; then
    echo "Running database seeders..."
    npx sequelize-cli db:seed:all --env production
    echo "Database seeders completed successfully!"
else
    echo "No seeders found, skipping..."
fi

echo "Database initialization completed!"