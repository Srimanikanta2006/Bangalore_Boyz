#!/usr/bin/env bash
# Render build script for cline_backend
# Run from repo ROOT so file:../agents and file:../orchestration resolve correctly.
set -e

echo "=== Installing cline_backend dependencies ==="
cd cline_backend
npm install

echo "=== Generating Prisma client ==="
npx prisma generate

echo "=== TypeScript build ==="
npm run build

echo "=== Build complete ==="
