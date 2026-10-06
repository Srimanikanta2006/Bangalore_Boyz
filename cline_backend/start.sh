#!/usr/bin/env bash
# Render start script for cline_backend
set -e

echo "=== Running Prisma migrations ==="
cd cline_backend
npx prisma migrate deploy

echo "=== Checking whether demo seed is needed ==="
SEED_MARKER=$(node -e "try{const {PrismaClient}=require('@prisma/client'); const p=new PrismaClient(); p.user.count().then(c=>{console.log(c>0?'SEEDED':'EMPTY'); return p.\$disconnect();}).catch(()=>console.log('EMPTY'));}catch(e){console.log('EMPTY')}")

if [ "$SEED_MARKER" = "EMPTY" ]; then
  echo "=== Database is empty - seeding demo data ==="
  npx tsx prisma/seed.ts || echo "=== Seed failed, starting server with existing data ==="
else
  echo "=== Database already seeded - skipping seed ==="
fi

echo "=== Starting server ==="
node dist/server.js
