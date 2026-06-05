# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────────────
# Medusa v2 backend (API + admin dashboard) — production image.
#
# Single stage on purpose: `medusa build` needs the full (dev+prod) dependency
# tree to compile the admin bundle, and the runtime then runs from the build
# output at apps/backend/.medusa/server. We mirror the *exact* working start
# recipe from apps/backend/package.json (symlink node_modules, copy .env) via
# docker-entrypoint.sh — we never `pnpm install` inside .medusa/server.
# ──────────────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim

# Build toolchain for native deps (sharp, swc, esbuild, etc.). Most ship
# prebuilt binaries, but keep these so node-gyp fallbacks don't break the build.
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /app

# 1) Install deps from manifests first (better layer caching). pnpm needs every
#    workspace package.json present to satisfy the frozen lockfile.
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/storefront/package.json ./apps/storefront/
RUN pnpm install --frozen-lockfile --filter @dtc/backend...

# 2) Build the backend (emits apps/backend/.medusa/server).
COPY apps/backend ./apps/backend
RUN pnpm --filter @dtc/backend build

# 3) Entrypoint runs migrations (which also run the one-time data seed) then
#    starts Medusa from inside .medusa/server.
WORKDIR /app/apps/backend
COPY apps/backend/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

ENV NODE_ENV=production
EXPOSE 9000
ENTRYPOINT ["./docker-entrypoint.sh"]
