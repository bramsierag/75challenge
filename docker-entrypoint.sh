#!/bin/sh
set -e

echo "Running database migrations..."
# Use the prisma binary directly instead of npx
node_modules/prisma/build/index.js migrate deploy

echo "Starting application as nextjs user..."
exec su-exec nextjs node server.js
