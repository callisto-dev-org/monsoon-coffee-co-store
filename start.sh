#!/bin/sh
cd /server/apps/backend

echo "Running database migrations..."
pnpm medusa db:migrate

echo "Seeding database..."
pnpm seed || echo "Seeding failed, continuing..."

echo "Starting Medusa development server..."

pnpm medusa build
cd .medusa/server && pnpm install
cp ../../.env .env.production
export NODE_ENV=production
pnpm run start