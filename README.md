# Spicy Meal Factory — Order & Inventory Management

Multi-role order & inventory management system for a food-production/distribution business.
Server-authoritative architecture (Supabase Postgres + Auth + Edge Functions + Storage) with a
React 19 + TypeScript front end.

> **Status: Phase 4 (Inventory ledger).** Built so far: the Phase 1 foundation (local Supabase,
> core schema + RLS + JWT role claim, auth, role-guarded routing, EN/AR + RTL, test harness), the
> Phase 2 master data & admin (suppliers, raw materials, admin CRUD, item images, Excel, hardened
> admin edge functions), and the Phase 3 ordering core (`create_customer_order` warehouse/factory
> split, guarded `set_order_status` with a **price snapshot at approval**, shared per-role Orders
> view) **plus** the inventory ledger: an append-only `stock_movements` ledger with a signed
> quantity, on-hand balances via the `item_stock` view, an `adjust_item_stock` RPC for manual
> corrections, automatic **fulfillment movements posted when a warehouse order is completed**, and an
> Inventory screen for warehouse/GM/accountant. Later phases (purchase orders, daily operation,
> reporting) are scoped but **not** built yet.

## Tech stack

React 19 · TypeScript (strict) · Vite 8 · Tailwind CSS v4 · TanStack Query · React Router 7 ·
React Hook Form + Zod · i18next (EN/AR, RTL) · date-fns (Asia/Riyadh) · Supabase
(`@supabase/supabase-js`) · Vitest + Testing Library · pgTAP · ESLint + Prettier.

## Prerequisites

- **Node.js 22** (see `.nvmrc`)
- **Docker** running (the local Supabase stack runs in containers)
- The Supabase CLI is bundled as a dev dependency and run via `npm run sb:*` — no global install.
- **Deno** (only to run/test the edge functions) — install from <https://deno.com>.

## Edge functions (admin user management)

`supabase/functions/admin-create-user` and `admin-update-user` are standard `Deno.serve` modules
that verify the caller's JWT and require the `admin` role before using the service-role key.

This sandboxed environment cannot start Supabase's `edge_runtime` container, so locally the functions
are run **directly** (the same code deploys unchanged to Supabase, which wraps the `Deno.serve`
export). From `supabase/functions/`, with `SUPABASE_URL` / `SUPABASE_ANON_KEY` /
`SUPABASE_SERVICE_ROLE_KEY` / `ALLOWED_ORIGINS` exported (from `npm run sb:status`):

```bash
deno task serve:create   # serves admin-create-user on :8000
deno task test           # authz unit tests (no token -> 401, non-admin -> 403, admin -> 200)
```

Point the web app at a directly-run function with `VITE_FUNCTIONS_BASE_URL` in `.env` (defaults to
`${VITE_SUPABASE_URL}/functions/v1`). Behind the agent proxy, export
`DENO_CERT=/root/.ccr/ca-bundle.crt` and `NODE_EXTRA_CA_CERTS=$DENO_CERT` so Deno can fetch modules.

## Getting started

```bash
npm install
```

Start the local Supabase stack (first run pulls Docker images):

```bash
npm run sb:start
```

Copy the printed **API URL** and **anon key** into `.env` (template in `.env.example`):

PowerShell:

```powershell
Copy-Item .env.example .env
# then paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from `npm run sb:status`
```

POSIX shell:

```bash
cp .env.example .env
# then paste VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY from `npm run sb:status`
```

Seed one user per role (reads the service-role key from the environment — **server-side only**):

PowerShell:

```powershell
$env:SUPABASE_URL = "http://127.0.0.1:54321"
$env:SUPABASE_SERVICE_ROLE_KEY = "<service_role key from sb:status>"
npm run seed:users
```

POSIX shell:

```bash
SUPABASE_URL="http://127.0.0.1:54321" \
SUPABASE_SERVICE_ROLE_KEY="<service_role key from sb:status>" \
npm run seed:users
```

Run the app:

```bash
npm run dev    # http://localhost:5173
```

### Seeded accounts

All share the password `Passw0rd!`:

| Email                            | Role              | Lands on      |
| -------------------------------- | ----------------- | ------------- |
| `admin@example.test`             | admin             | `/admin`      |
| `customer@example.test`          | customer          | `/customer`   |
| `warehouse_manager@example.test` | warehouse_manager | `/warehouse`  |
| `factory_manager@example.test`   | factory_manager   | `/factory`    |
| `general_manager@example.test`   | general_manager   | `/gm`         |
| `accountant@example.test`        | accountant        | `/accountant` |

## Scripts

| Command                                      | Description                                  |
| -------------------------------------------- | -------------------------------------------- |
| `npm run dev`                                | Vite dev server                              |
| `npm run build`                              | Production build                             |
| `npm run typecheck`                          | `tsc --noEmit`                               |
| `npm run lint`                               | ESLint (flat config)                         |
| `npm run test`                               | Vitest unit tests                            |
| `npm run sb:start` / `sb:stop` / `sb:status` | Local Supabase stack                         |
| `npm run db:reset`                           | Re-apply all migrations (wipes local data)   |
| `npm run db:test`                            | Run pgTAP database tests                     |
| `npm run db:types`                           | Generate `src/types/db.ts` from the local DB |
| `npm run seed:users`                         | Seed one user per role                       |

## Testing

- **Unit (Vitest):** currency/RTL formatting, route-guard redirects, env validation, timezone day-boundary.
  ```bash
  npm run test
  ```
- **Database (pgTAP):** `orders` Row Level Security (customer isolation, staff/admin read, insert rules),
  the ordering RPCs (cart → warehouse/factory split, transition authorization, price snapshot on approval),
  and the inventory ledger (stock adjustments, authorization, fulfillment movements on completion).
  ```bash
  npm run db:test
  ```
- **CI** (`.github/workflows/ci.yml`): typecheck + lint + unit tests + build, plus a Postgres
  service-container job that applies migrations and runs the pgTAP suite.

## Architecture notes (Phase 1)

- **Role lives in the JWT.** `profiles.role` is mirrored into `auth.users.app_metadata.role`; RLS
  reads the claim via `public.jwt_role()` and never selects from `profiles` (no recursive RLS).
  Changing a role only takes effect after the user gets a new JWT (re-login / token refresh).
- **RLS on every table**, deny-by-default, four-policy structure. Customers see only their own
  profile and orders; staff read orders; admin has full access.
- **Money** is `numeric(14,2)`, **quantities** `numeric(14,3)`; the business day boundary uses
  `Asia/Riyadh` (UTC+3, no DST).
- **Design tokens** live in `src/index.css` (`@theme`); components never hard-code hex values.
- **Local-dev note:** the Supabase `edge_runtime` and `pgdelta` services are disabled in
  `supabase/config.toml` because they don't start in restricted sandbox containers; they aren't
  needed for Phase 1.

## Project structure

```
src/
  app/          providers (Query/Auth/I18n) + router (RequireAuth, RoleGuard)
  features/     auth (login), admin (CRUD), orders (entry + lifecycle), inventory (ledger), dashboards
  components/   layout shell + token-driven UI primitives
  lib/          env, supabase client, currency, datetime, constants
  i18n/         en/ar resources + i18next init
supabase/
  migrations/   ordered, idempotent SQL (schema + RLS + JWT roles + ordering RPCs)
  functions/    Deno edge functions (admin user management)
  tests/        pgTAP suites (orders RLS, ordering RPCs, inventory ledger)
  ci/           CI-only auth shims for plain-Postgres pgTAP
  scripts/      seed-users.mjs
tests/          Vitest unit tests
```
