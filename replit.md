# Photon Deriv Trader

A modular Deriv Synthetic Indices workspace for market-structure analysis, user settings, and future demo-only trading.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/photon-deriv-trader run dev` — run the web app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/photon-deriv-trader` — React + TypeScript web app
- `artifacts/api-server` — shared Express API, Clerk session middleware, authenticated workspace routes
- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/` — Drizzle PostgreSQL schema
- `lib/api-client-react` and `lib/api-zod` — generated API hooks and validators

## Architecture decisions

- Public Deriv market data uses the official unauthenticated WebSocket endpoint; it does not require or expose a trading token.
- Authenticated trading uses a separate OTP-issued WebSocket URL; any future connection must be demo-only and must not reuse the public quote feed.
- Workspace settings are scoped to the Clerk user ID and persisted in PostgreSQL.
- Do not infer or invent missing Photon Trading rules. Label unverified concepts and thresholds accordingly.
- Real-money trading stays disabled.

## Product

- The initial build includes authenticated per-user settings, dashboard status, and the market-data foundation.
- Market prices and candles must be real Deriv responses or explicitly unavailable; never use invented values as live data.

## User preferences

- The supplied master prompt defines the product scope and its staged delivery, starting with Phase 1 and the Phase 2 market-data foundation.

## Gotchas

- After changing `lib/api-spec/openapi.yaml`, run `pnpm --filter @workspace/api-spec run codegen`.
- Development database schema changes use `pnpm --filter @workspace/db run push`.
- Never expose Deriv account tokens in browser code, local storage, or public frontend variables.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
