# System Architecture

## Overview
This document describes the high-level architecture of the `Bangalore_Boyz` project. It serves as the primary reference for all developers and AI agents working on the codebase.

---

## High-Level System Diagram

```text
                  +-------------------------+
                  |     Frontend Client     |
                  |  React 18 + Vite + TS   |
                  |  (Citizen / Gov / Rescue)|
                  +------------+------------+
                               | REST (JWT Bearer)
                               v
                  +-------------------------+
                  |     Backend Service     |
                  |  Express + TypeScript   |
                  |  (API & Business Logic) |
                  +------+-------------+----+
                         |             |
                         v             v
              +-------------------+  +----------------------+
              |     Postgres      |  |   BullMQ + Redis     |
              |  (Docker/Supabase)|  | (optional async       |
              |  via Prisma ORM   |  |  hazard pipeline)      |
              +-------------------+  +----------------------+
                         |
                         v
              +-------------------------+
              |  External providers    |
              |  Open-Meteo, Gemini     |
              |  (all best-effort, all  |
              |  fail gracefully - see  |
              |  FAILURE_MODES.md)      |
              +-------------------------+
```

---

## Component Breakdown

### 1. Frontend
* **Purpose**: User-facing application for three personas (Citizen, Government HQ/Mobile, Rescue/Field).
* **Tech Stack**: React 18 + TypeScript, Vite (build/dev server), React Router v7, Tailwind CSS.
* **Responsibilities**: Render UI, handle geolocation/routing, hold the single JWT auth session (`localStorage`, via `lib/api.ts`/`AuthContext`), call backend REST APIs.
* **Auth model**: one unified token store and one `RequireAuth`/role-guard system for every persona — see ADR-003/§7b in `docs/DECISIONS.md` for the regression that was found and fixed here.

### 2. Backend
* **Purpose**: Core business logic, deterministic risk engine, RBAC, all external-provider integration.
* **Tech Stack**: Node.js + Express 4 + TypeScript, Prisma ORM, Zod (validation), JWT (`jsonwebtoken`) + `bcryptjs` (auth), Multer (evidence uploads), `express-rate-limit`.
* **Responsibilities**: Execute business logic, own authentication/authorization, own all database access, own all external-provider calls (weather, AI, CAP export), expose `/metrics`.

### 3. Database (PostgreSQL via Prisma)
* **Provider (local dev)**: Docker Compose service (`cline_backend/docker-compose.yml`, PostgreSQL 16, named volume `climateshield_pgdata`).
* **Provider (shared team dev)**: a shared Supabase Postgres project — Supabase is used purely as **managed Postgres hosting**, not as the auth provider (see ADR-003). Each teammate connects with their own Supabase-issued credentials.
* **Responsibilities**: Persistent application state for every domain entity (Users, Zones, Hazards, Incidents, Tasks, Units, RiskScores, Notifications, CitizenReports, SosEvents, AuditLog, ...).
* **Access Model**: The API is the *only* database client — the frontend never connects directly to Postgres. Migrations are additive-only against the shared project (never `migrate reset`/full reseed on shared data).

### 4. Async pipeline (BullMQ + Redis) — optional
* **Purpose**: Decouples hazard ingestion from downstream risk-recompute/notification/report-generation work (Chunk H, an explicit Phase-3 requirement).
* **Architecture**: `REDIS_URL` unset (default) → all three pipeline stages run inline/synchronously, same process, same DB effects. `REDIS_URL` set → the exact same stage functions run as real, asynchronously-processed BullMQ jobs on a Redis-backed queue. Verified working in both modes (`cline_backend/src/queue/`).
* **Tech Stack**: `bullmq` + `ioredis`.

### 5. AI layer (Google Gemini) — narrowly scoped, never authoritative
* **Purpose**: (a) grounded narrative explanation of an already-computed incident/cascade, (b) best-effort photo triage of citizen-uploaded hazard evidence.
* **Architecture**: low-temperature, JSON-schema-validated calls; deterministic fallback (explanation) or silent skip (photo triage) on any failure. **Never** used to compute a risk score — see `docs/RISK_METHODOLOGY.md` §5.
* **Tech Stack**: `generativelanguage.googleapis.com` REST API (no SDK dependency).

---

## Important Architectural Boundaries

1. **Frontend / Backend Separation**: The frontend communicates exclusively via the Express REST API (`/api/*`), authenticated with a JWT Bearer token.
2. **AI Isolation**: Gemini is confined to narrative/photo-triage features behind a strict validate-or-discard contract; it never influences the deterministic risk engine (`docs/RISK_METHODOLOGY.md`).
3. **Database Security**: The frontend never connects directly to PostgreSQL; the API validates JWTs and performs all database access through Prisma.
4. **Optional-dependency isolation**: Redis and every external HTTP provider are optional at the architecture level — their absence changes *behavior* (inline fallback, omitted field, `NOT_CONFIGURED` status) but never *availability* of the core product. See `docs/FAILURE_MODES.md`.

---

## Deployment & Scalability

*(Chunk J — Phase 3 documentation requirement.)*

### Current (hackathon MVP) deployment shape
- **Backend**: single Express process (Node.js), stateless except for the in-memory
  `/metrics` registry (resets on restart — see limitation below) and the optional in-process
  BullMQ worker.
- **Database**: single Postgres instance (Docker locally, or a shared Supabase project for
  the team). No read replicas, no connection pooler beyond Prisma's own pool.
- **Redis**: optional, single instance, no persistence configured (`redis:7-alpine`
  defaults) — acceptable because it only holds transient job state, never the source of
  truth (Postgres always is).
- **Frontend**: static Vite build, deployable to any static host/CDN (no server-side
  rendering).

### How this would scale for a real municipal deployment

| Concern | Current MVP | Real-deployment path |
|---|---|---|
| Multiple backend instances | Single process | Express is already stateless (JWT auth, no in-process session) — horizontally scale behind a load balancer with zero code changes. The one exception is the in-memory `/metrics` registry, which would need to move to `prom-client` + a shared store (or per-instance scraping with aggregation at the Prometheus level) |
| Database throughput | Single Postgres instance | Add a connection pooler (PgBouncer/Supabase's built-in pooler), then read replicas for the read-heavy government dashboards (`/analytics/overview`, `/hotspots`, cascade views) once traffic warrants it |
| Async pipeline | Single BullMQ worker | Run multiple `Worker` processes against the same Redis — BullMQ handles job distribution/locking natively, no code changes needed, only more worker processes |
| External provider rate limits | Open-Meteo/Gemini calls are best-effort with short in-memory caches | Move to a shared Redis-backed cache (already have Redis in the stack from Chunk H) so multiple backend instances share one cache instead of each polling independently |
| Static evidence storage | Local disk (`uploads/evidence/`, see ADR-004) | Swap to S3-compatible object storage (Supabase Storage, or AWS S3) behind the same `evidenceUrl()` abstraction — this was already an explicit, documented tradeoff in ADR-004 for hackathon speed |
| Notification delivery | DB-only + honest `NOT_CONFIGURED` outbox | Wire the documented MSG91 (SMS) provider behind the existing `NotificationChannel` interface (`src/notifications/delivery.service.ts`) — the retry/backoff mechanism is already built and tested, only the provider implementation is missing |
| Observability | `/metrics` (Prometheus text), structured JSON logs to stdout | Point a real Prometheus server at `/metrics` per instance; ship stdout logs to any log aggregator (already structured JSON, zero reformatting needed) |

### Why this shape was chosen for the hackathon
Every piece above was picked because it is **free, self-hostable, and requires no new paid
service to demonstrate** (Postgres, Redis, BullMQ, Prometheus text format) — consistent with
the project's "no fabricated integrations, no unnecessary paid dependencies" principle
throughout `docs/MASTER_PLAN.md`.
