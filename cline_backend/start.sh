#!/usr/bin/env bash
# Render start script for cline_backend.
# NOTE (2026-10-06): Prisma migrations and demo seeding are run OUT-OF-BAND
# (from a dev machine with DB access - see docs/DEPLOYMENT.md) BEFORE the
# Render deploy. Running them here previously caused the server to miss
# Render's port-binding window and the deploy to time out.
set -e

echo "=== Starting ClimateShield API server ==="
cd cline_backend
exec node dist/server.js
