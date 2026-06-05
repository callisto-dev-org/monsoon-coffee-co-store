# syntax=docker/dockerfile:1
# ──────────────────────────────────────────────────────────────────────────────
# Next.js 15 storefront — production image (standalone output).
#
# IMPORTANT: NEXT_PUBLIC_* are inlined into the bundle at BUILD time (and
# check-env-variables.js hard-fails the build if NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
# is missing). They must be passed as --build-arg. Server-only vars
# (MEDUSA_BACKEND_URL, REDIS_URL, STOREFRONT_REVALIDATE_SECRET) are read at
# RUNTIME by the standalone Node server and are injected via compose env_file.
# ──────────────────────────────────────────────────────────────────────────────

# ── builder ───────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS builder

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/
COPY apps/storefront/package.json ./apps/storefront/
RUN pnpm install --frozen-lockfile --filter @dtc/storefront...

# Build-time public config (baked into the client bundle).
ARG NEXT_PUBLIC_BASE_URL
ARG NEXT_PUBLIC_VERCEL_URL
ARG NEXT_PUBLIC_MEDUSA_BACKEND_URL
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ARG NEXT_PUBLIC_DEFAULT_REGION
ARG NEXT_PUBLIC_STORE_ADDRESS
# Only needed when serving product images from S3 (next.config.js reads these
# at build time to whitelist the image host).
ARG MEDUSA_CLOUD_S3_HOSTNAME
ARG MEDUSA_CLOUD_S3_PATHNAME
ENV NEXT_PUBLIC_BASE_URL=$NEXT_PUBLIC_BASE_URL \
    NEXT_PUBLIC_VERCEL_URL=$NEXT_PUBLIC_VERCEL_URL \
    NEXT_PUBLIC_MEDUSA_BACKEND_URL=$NEXT_PUBLIC_MEDUSA_BACKEND_URL \
    NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY \
    NEXT_PUBLIC_DEFAULT_REGION=$NEXT_PUBLIC_DEFAULT_REGION \
    NEXT_PUBLIC_STORE_ADDRESS=$NEXT_PUBLIC_STORE_ADDRESS \
    MEDUSA_CLOUD_S3_HOSTNAME=$MEDUSA_CLOUD_S3_HOSTNAME \
    MEDUSA_CLOUD_S3_PATHNAME=$MEDUSA_CLOUD_S3_PATHNAME \
    NEXT_TELEMETRY_DISABLED=1

COPY apps/storefront ./apps/storefront
# `build` runs `next build && copy:standalone` (copies .next/static + public
# into the standalone tree).
RUN pnpm --filter @dtc/storefront build

# ── runner ────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=8000 \
    HOSTNAME=0.0.0.0

# The standalone tree was traced from the repo root (outputFileTracingRoot), so
# it contains apps/storefront/server.js + a minimal node_modules + (via
# copy:standalone) .next/static and public. Copy it as the new /app root.
COPY --from=builder /app/apps/storefront/.next/standalone ./

USER node
EXPOSE 8000
CMD ["node", "apps/storefront/server.js"]
