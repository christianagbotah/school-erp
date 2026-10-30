#!/bin/sh
# iEduPro container entrypoint — first boot: schema + demo seed, then serve.
set -e

DB_PATH="/app/db/custom.db"

if [ ! -f "$DB_PATH" ]; then
  echo "[iEduPro] No database found — applying schema and seeding demo school…"
  mkdir -p /app/db
  bunx prisma db push --accept-data-loss --skip-generate
  bun scripts/seed.ts
  bun scripts/seed-extras.ts
  echo "[iEduPro] Demo data ready (fabricated records, password Demo1234! — change before real use)."
fi

exec bun server.js
