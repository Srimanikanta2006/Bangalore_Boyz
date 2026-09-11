#!/usr/bin/env bash
# Render start script for cline_backend
set -e

echo "=== Running Prisma migrations ==="
cd cline_backend
npx prisma migrate deploy

echo "=== Seeding demo data ==="
npx tsx prisma/seed.ts

echo "=== Starting server ==="
node dist/server.js
