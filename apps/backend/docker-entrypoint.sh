#!/bin/sh
# ──────────────────────────────────────────────────────────────────────────────
# Production entrypoint for the Medusa backend.
#
# Mirrors the working start recipe in apps/backend/package.json:
#   cd .medusa/server -> symlink node_modules -> copy .env -> medusa start
# and prepends `medusa db:migrate`, which applies schema migrations, syncs
# module links, AND runs any pending data-migration scripts (the initial seed)
# exactly once — tracked, so it's a no-op on every subsequent boot.
# ──────────────────────────────────────────────────────────────────────────────
set -e

cd /app/apps/backend/.medusa/server

# The build output ships without node_modules; point it at the workspace tree
# that pnpm installed (apps/backend/node_modules). NEVER `pnpm install` here.
[ -e node_modules ] || ln -s ../../node_modules node_modules

# Medusa loads .env.production when NODE_ENV=production. Compose bind-mounts the
# real env file to /app/apps/backend/.env (= ../../.env from here).
cp -f ../../.env .env.production

export NODE_ENV=production

echo "Running migrations (and first-boot data seed)..."
./node_modules/.bin/medusa db:migrate

echo "Starting Medusa..."
exec ./node_modules/.bin/medusa start
