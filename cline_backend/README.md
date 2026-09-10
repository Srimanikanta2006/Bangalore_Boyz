# ClimateShield Backend

**Urban Climate Risk, Heat & Flood Resilience Platform — Government Operations / Emergency Command Center backend.**

Node.js + Express + TypeScript + PostgreSQL (Supabase) + Prisma REST API powering the Government Command Center UI: Overview, Live Map, Incidents, Response Center, Simulator, Infrastructure, Analytics, Historical Hotspots and Departments.

> **DEMO DATA NOTICE** — every coordinate, measurement, hazard, incident and historical record seeded by this project is **SYNTHETIC DEMO data** for a fictional municipal area ("Bayview Metro"). It is not real-world observation data, and every payload that carries demo data is tagged `dataQuality: "SYNTHETIC_DEMO"` (or `source: "SYNTHETIC_DEMO"` on historical events).

---

## Architecture

Single, well-structured Express service (no microservices, no overengineering — 24h hackathon scope):

```
Frontend (separate)  ->  REST /api  ->  routes (validation + auth guards)
                                  ->  controllers (thin)
                                  ->  services  (ALL business logic)
                                      |- risk.service      deterministic risk engine
                                      |- cascade.service   dependency-graph cascade engine
                                      |- task.service      dispatch transactions + lifecycle
                                      |- simulator.service deterministic scenario math
                                      '- ...11 more domain services
                                  ->  Prisma (parameterized)  ->  PostgreSQL (Supabase)
```

- **Backend owns all business logic**: incident/task state machines, unit availability, dispatch rules, SLA deadlines, risk scores, cascade analysis, response plans, audit history. The frontend only renders.
- **Cascade relationships live in the database** (`DependencyEdge`), never in code or the frontend.

## Project structure

```
cline_backend/
  src/
    app.ts  server.ts                 # Express app + graceful server
    config/env.ts                     # Zod-validated environment
    db/prisma.ts                      # Prisma singleton + health probe
    middleware/                       # auth (JWT+roles), validation, errors, request logging
    routes/        (17 routers)       # endpoint definitions
    controllers/   (14)              # thin HTTP handlers
    services/      (17)              # business logic
    validators/    (6 Zod schemas)   # request contracts
    types/                            # api / auth / domain DTOs
    utils/                            # errors, pagination, ids, dates, risk weights, state machines
  prisma/
    schema.prisma   seed.ts  seed-data.ts  migrations/
  tests/  unit + integration (vitest + supertest)
  scripts/smoke.sh                   # live end-to-end journey via curl
  docs/API.md                        # full endpoint contracts
```

## Quickstart

### Option A — local PostgreSQL via Docker

```bash
docker run -d --name climateshield-pg \
  -e POSTGRES_USER=postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=climateshield \
  -p 5432:5432 postgres:16-alpine

cp .env.example .env   # then set the local URLs shown below
```

`.env` for local docker:

```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/climateshield
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/climateshield
JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
```

### Option B — Supabase (production)

1. Create a project at [supabase.com](https://supabase.com).
2. **Project Settings → Database → Connection string → URI**:
   - **Transaction pooler** (`...pooler.supabase.com:6543/postgres?pgbouncer=true`) → `DATABASE_URL` (runtime queries)
   - **Session/direct** (`...pooler.supabase.com:5432/postgres` or the `db.<ref>.supabase.com:5432` URL) → `DIRECT_URL` (migrations)
3. Put both in `.env` (never commit it).

### Install, migrate, seed, run

```bash
npm install
npx prisma migrate deploy     # or: npm run prisma:migrate (dev)
npx prisma db seed             # SYNTHETIC DEMO dataset
npm run dev                    # tsx watch  (http://localhost:4000)

# production
npm run build && npm start
```

## Environment variables (`.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | yes | Pooled PostgreSQL URL (Supabase pgBouncer `:6543` or local Postgres) — runtime queries |
| `DIRECT_URL` | yes* | Direct PostgreSQL URL — Prisma migrations/admin (*falls back to `DATABASE_URL`) |
| `JWT_SECRET` | yes | ≥32-char random secret (`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `JWT_EXPIRES_IN` | no | Token lifetime (default `12h`) |
| `PORT` | no | Default `4000` |
| `NODE_ENV` | no | `development` / `test` / `production` |
| `CORS_ORIGIN` | no | Comma-separated frontend origins, or `*` for dev |
| `DEMO_USER_PASSWORD` | no | Password assigned to all seeded demo accounts (default `DemoGov@2024`) |
| `WEATHER_PROVIDER` | no | Live weather provider (default `OPEN_METEO` — no API key required) |
| `WEATHER_API_KEY` | no | Reserved for future key-based providers (unused by Open-Meteo) |
| `WEATHER_CACHE_SECONDS` | no | In-memory cache TTL for live weather (default `300`; `0` disables) |
| `WEATHER_POLL_INTERVAL_MINUTES` | no | Background zone polling for snapshot history (default `10`; `0` disables) |

**No external API keys are needed.** The MVP is fully self-contained; the `WEATHER_API` hazard source enum is reserved for a future live-weather integration (seeded hazards are synthetic). The only credentials you must supply are your own Supabase database URLs + a generated `JWT_SECRET`.

## Demo credentials (SYNTHETIC DEMO accounts)

All seeded accounts share the password `DEMO_USER_PASSWORD` (default **`DemoGov@2024`** — change it in `.env` before demoing):

| Email | Role | Purpose |
|---|---|---|
| `government@climateshield.demo` | `GOVERNMENT_OPERATOR` | Command Center operator (full gov screens) |
| `dispatcher@climateshield.demo` | `DISPATCHER` | Dispatch + task management |
| `admin@climateshield.demo` | `ADMIN` | Everything incl. audit |
| `field@climateshield.demo` | `FIELD_OPERATOR` | Acknowledge/start/complete tasks |
| `analyst@climateshield.demo` | `ANALYST` | Read-only analytics + simulations |

```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"government@climateshield.demo","password":"DemoGov@2024"}'
# -> { "success": true, "data": { "user": {...}, "token": "eyJ..." } }
```

Send every subsequent request with `Authorization: Bearer <token>`.

## API overview

Full contracts with request/response examples: **[docs/API.md](docs/API.md)**.

| Screen | Endpoints |
|---|---|
| Auth | `POST /api/auth/login`, `GET /api/auth/me` |
| Health | `GET /api/health` |
| Overview | `GET /api/government/overview` |
| Live Map | `GET /api/map/assets\|hazards\|incidents\|units\|overlays` |
| Incidents | `GET/POST /api/incidents`, `GET/PATCH /api/incidents/:id`, `PATCH /api/incidents/:id/status`, `GET /api/incidents/:id/cascade`, `POST /api/incidents/:incidentId/dispatch` |
| Response Center | `GET /api/response-center`, `POST /api/zones/:zoneId/response-plan` |
| Tasks | `GET/POST /api/tasks`, `GET /api/tasks/:id`, `PATCH /api/tasks/:id/status`, `POST /api/tasks/:id/assign\|verify`, `GET /api/tasks/:id/history` |
| Infrastructure | `GET /api/infrastructure`, `GET /api/infrastructure/:id` (+ `/telemetry` `/risk` `/dependencies` `/logs`), `POST /api/infrastructure/:id/assign-team\|maintenance\|reroute` |
| Zones | `GET /api/zones`, `GET /api/zones/:id`, `GET /api/zones/:zoneId/cascade` |
| Hazards | `GET/POST /api/hazards`, `GET /api/hazards/:id` |
| Simulator | `POST /api/simulations`, `GET /api/simulations`, `GET /api/simulations/:id` |
| Analytics | `GET /api/analytics/overview` |
| Hotspots | `GET /api/hotspots`, `GET /api/hotspots/:id` |
| Departments | `GET /api/departments`, `GET /api/departments/:id` (+ `/units`, `/readiness`) |
| Units | `GET /api/units`, `GET /api/units/:id`, `PATCH /api/units/:id/status` |
| Audit | `GET /api/audit` (ADMIN, GOVERNMENT_OPERATOR) |

## The critical user journey (tested end-to-end)

```bash
bash scripts/smoke.sh            # against a running server
npm test                         # 68 unit + integration tests
```

1. Government operator logs in → JWT.
2. `GET /api/government/overview` → resilience index, threats, infrastructure, mobility, grid, readiness (all computed from PostgreSQL).
3. `GET /api/response-center` → active/critical incidents, severity groups, unassigned queue, readiness, telemetry, hotspots.
4. `GET /api/incidents/INC-204` → severity, hazard, zone, SLA, cascade chain, available units.
5. `POST /api/incidents/INC-204/dispatch { "unitId": "..." }` → **one transaction** creates the task, assigns the unit, writes `TaskStatusHistory` + `AuditLog`, and acknowledges a `NEW` incident. Duplicate dispatch → `409 DUPLICATE_DISPATCH`.
6. Field operator: `PATCH /api/tasks/:id/status` `ACKNOWLEDGED → IN_PROGRESS → COMPLETED` (invalid skips → `422 INVALID_STATUS_TRANSITION`; completing releases the unit).
7. Government: `POST /api/tasks/:id/verify` → verified + audited.
8. `GET /api/tasks/:id/history` + `GET /api/audit` show the complete operational chain.

## Live weather (location-aware, real provider)

`GET /api/weather/current?latitude=<lat>&longitude=<lng>&forecastHours=<0-24>` — authenticated. Calls **Open-Meteo live** (no API key, no seed/DB dependency for current data), normalizes the provider payload, applies a short in-memory cache (`WEATHER_CACHE_SECONDS`) and returns honest metadata. The frontend never talks to the provider directly.

Data provenance (every payload labels its own quality):

| Provider | Data | Status |
|---|---|---|
| Open-Meteo (current) | temperature, precipitation/rainfall, wind speed/direction, WMO condition, humidity | `LIVE_OBSERVED` |
| Open-Meteo (hourly) | requested forecast hours | `FORECAST` |
| Threshold classification | hazard severity derived from live observations (documented thresholds) | `MODELED` |
| Risk engine | calculated risk | `MODELED` |
| Cascade engine | dependency impact | `MODELED` |
| Flood/hydrology provider | water level / flood depth | **NOT INTEGRATED** — `waterDepth` is always `null` ("Live flood-depth source unavailable") |
| OSM/Overpass | geographic infrastructure | not integrated (seeded assets remain `SYNTHETIC_DEMO`) |
| Seeded hazards/incidents/history | demo operational data | `SYNTHETIC_DEMO` (hazard `dataQuality` column; never auto-seeded in production) |

Notes: coordinates resolve to a seeded zone only via its (explicitly synthetic) boundary polygon — otherwise `zone: null`; nothing is invented. Background polling (`WEATHER_POLL_INTERVAL_MINUTES`) persists `WeatherSnapshot` history rows for dashboard readiness — visible via `GET /api/weather/history`.

## Deterministic engines (no AI)

**Risk** (`src/services/risk.service.ts`):

```
risk = hazardSeverityComponent × assetVulnerability × assetCriticality × historicalRecurrenceFactor
```

- severity weights LOW .25 / MODERATE .5 / HIGH .75 / CRITICAL 1.0 (intensity readings add ≤ +0.25)
- criticality weights LOW .3 / MEDIUM .55 / HIGH .8 / CRITICAL 1.0
- recurrence factor `1 + min(0.25, priorEvents × 0.05)`
- normalized to 0–100; buckets ≥80 CRITICAL, ≥60 HIGH, ≥40 MODERATE; confidence from data completeness; per-factor contributions returned for the UI.

**Cascade** (`src/services/cascade.service.ts`): cycle-safe BFS over `DependencyEdge` (depth ≤ 6), impact decays by edge strength × 0.9^depth, impact types mapped from hazard × asset type. Seeded graph includes the spec chain `Drain D07 → Road R24 → St. Jude Gate B → St. Jude Hospital`.

**Simulator** (`src/services/simulator.service.ts`): transparent severity derivation (rainfall amplified by drainage throughput + tidal surge, heat and wind thresholds), then per-zone risk/damage/population projections persisted as `Simulation` + `SimulationResult`.

## Reliability & security

- Transactional dispatch/task lifecycle — **no partial writes** (task + unit + history + audit commit or roll back together)
- Backend-owned state machines with `422` on invalid transitions; every transition stored in `TaskStatusHistory`
- Duplicate-dispatch protection (`409`), unit availability checks (`409`)
- JWT auth (12h), bcrypt password hashing, DB-backed account revocation, server-side role checks (`GOVERNMENT_OPERATOR` / `DISPATCHER` / `ADMIN` for operational actions)
- Zod validation on every body/query; Helmet, CORS allow-list, login rate limiting, 1MB body limit
- Consistent error envelope `{ success:false, error:{ code, message, details? } }`; no stack traces in production
- Structured JSON request logging with request ids; `GET /api/health` performs a real DB probe
- Prisma parameterized queries only — no string-concatenated SQL

## Tests

```bash
npm test        # 68 tests: risk engine, cascade engine, state machines, simulator math,
                # + two integration suites (critical journey & all screens) via supertest
```

Integration suites auto-skip if no database is reachable. Run `npx prisma db seed` first for the full demo dataset (the suites assert against seeded demo facts like `INC-204`).

## Frontend integration

- **Postman**: import `postman/ClimateShield.postman_collection.json` — 54 ready-to-fire requests in 15 folders. The **Login** request auto-saves the JWT to `{{token}}` (used by every other request), and Dispatch/Create-task/List-simulations/List-hotspots auto-save ids (`{{taskCode}}`, `{{simulationId}}`, `{{hotspotId}}`) so the whole collection works in sequence.
- Base URL: `http://localhost:<PORT>/api`
- Attach `Authorization: Bearer <token>` from `POST /api/auth/login` to every call except `/api/health` and `/api/auth/login`
- All success responses: `{ "success": true, "data": ... }`; lists use `{ items, pagination }`
- Map endpoints return GeoJSON `FeatureCollection`s ready for MapLibre
- Human-readable ids (`INC-204`, `TASK-005`, `DRAIN-07`, `EB`, `PW-DRAIN-A1`) are accepted anywhere an `:id` path parameter is documented
- **Replace mock data with these endpoints — do not duplicate business logic in the frontend.**

## What you must configure before running

1. `DATABASE_URL` + `DIRECT_URL` → your Supabase (or local) PostgreSQL connection strings
2. `JWT_SECRET` → a generated random secret
3. (Optional) `DEMO_USER_PASSWORD` → your demo password, `CORS_ORIGIN` → your frontend origin

No third-party API keys are required for the MVP.
