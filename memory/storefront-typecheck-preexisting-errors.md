---
name: storefront-typecheck-preexisting-errors
description: Storefront tsc has pre-existing unrelated type errors; build ignores them
metadata:
  type: reference
---

`apps/storefront` fails `tsc --noEmit` with many PRE-EXISTING errors unrelated to most changes:
- Project-wide `TS2786 'X' cannot be used as a JSX component` (FC vs ReactNode) across the account module — a React types version mismatch.
- `src/lib/data/cart.ts` `setAddresses` (~line 415): `CartAddressPayload` not assignable to `StoreUpdateCart`.

`apps/storefront/next.config` sets `typescript.ignoreBuildErrors: true`, so `next build` succeeds despite these. When validating a change, grep tsc output for the specific files you touched rather than expecting a clean exit. Backend (`apps/backend`) DOES type-check clean (exit 0).
