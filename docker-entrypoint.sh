#!/bin/sh
set -e

echo "Running database migrations..."
npx prisma migrate deploy

echo "Starting application as nextjs user..."
exec su-exec nextjs node server.js
