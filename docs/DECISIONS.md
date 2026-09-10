# Architectural Decision Records (ADR)

This file logs key architectural decisions, rationale, alternatives considered, and status.

---

## ADR-001: Use Supabase as Shared Database & Backend Service

* **Date**: 2026-09-10
* **Status**: Superseded by ADR-003

### Context
The team requires a unified, real-time, relational database and backend service accessible by multiple teammates working across different machines and AI tools during the hackathon.

### Decision
Use **Supabase** as the shared PostgreSQL database and backend infrastructure platform.

### Rationale
1. **Multi-Developer Support**: Team members can be added to the shared Supabase project using their own individual Supabase accounts.
2. **Feature Set**: Built-in support for PostgreSQL, Row-Level Security (RLS), Auth, Realtime, Storage, and Vector extensions (`pgvector`).
3. **No Credential Sharing**: Developers authenticate independently; no shared secrets or personal access tokens need to be committed to Git.

### Alternatives Considered
- **Local SQLite / Postgres**: Hard to synchronize real-time state across teammates.
- **Custom Docker Postgres**: Requires extra deployment infrastructure and port mapping setup during a short hackathon window.

---

## ADR-002: AI Coding Agent Governance via AGENTS.md and Repository Documentation

* **Date**: 2026-09-10
* **Status**: Accepted

### Context
Team members use different AI coding environments (Antigravity, Cursor, Windsurf, Claude Code, VS Code). AI tools lose context across sessions and editors.

### Decision
Establish `AGENTS.md` and `docs/*` as the single source of truth for all AI coding agents working in this repository.

### Rationale
Ensures portability, architectural consistency, and safety across all AI tools without relying on ephemeral chat histories.

---

## ADR-003: Citizen Auth Reuses Backend JWT (Not Supabase Auth)

* **Date**: 2026-09-10/11
* **Status**: Accepted

### Context
Government/rescue accounts already authenticate via `cline_backend`'s own `POST /api/auth/login` + JWT (local Prisma `User` table, bcrypt password hashes) — Supabase is used only as the Postgres host, not as an auth provider. The citizen workflow needed login + role-based redirect.

### Decision
Add a `CITIZEN` value to the existing Prisma `Role` enum and reuse the existing JWT/`authenticate`/`requireRole` stack unchanged. Login redirect target is derived from the server-returned role (`CITIZEN -> /citizen/map`, government roles -> their own landing pages).

### Rationale
1. **One auth system for every role** — no second auth provider to reconcile, no dual-JWT-vs-Supabase-session logic on the backend.
2. **Fail-closed by construction** — `CITIZEN` is simply absent from every existing `requireRole(...)` list, so all government write endpoints deny it automatically; an additional `blockCitizenFromInternal` guard hides internal read endpoints too.
3. **Zero disruption to the gov/rescue teammates' branches**, who keep using the exact same login endpoint and token shape.

### Alternatives Considered
- **Supabase Auth for citizens only (hybrid)**: two auth systems to reconcile; backend would need to additionally trust and verify Supabase-issued JWTs for `/api/citizen/*`. Rejected for added complexity with no corresponding benefit at this stage.
- **Supabase Auth for the whole app**: cleanest long-term, but a cross-cutting change requiring coordinated sign-off/migration across the gov and rescue branches. Deferred — can be revisited post-hackathon.

---

## ADR-004: Citizen Evidence Storage — Local Disk (Multer)

* **Date**: 2026-09-10
* **Status**: Accepted

### Context
Citizen hazard reports need photo evidence. No file/media storage existed anywhere in the backend.

### Decision
Store uploaded evidence on local disk (`cline_backend/uploads/evidence/<uuid>.<ext>`), served read-only via `express.static` at `/media/evidence`. One new dependency: `multer`. Limits: jpg/png/webp, ≤5MB, max 3 files/report. `uploads/` is git-ignored.

### Rationale
Self-contained for a hackathon MVP/demo — no external provider, no keys/buckets to configure, no binaries stored in Postgres.

### Alternatives Considered
- **URL-only**: zero backend storage, but pushes hosting onto the frontend/client device — not viable for a mobile citizen flow.
- **Supabase Storage**: production-appropriate, but needs bucket configuration/keys on the shared project; deferred until the shared Supabase connection is fully wired up (see ADR-001 follow-up).

---

## ADR-005: Safe-Route Scoring — Client-Supplied Geometry + Backend Risk Scoring

* **Date**: 2026-09-10
* **Status**: Accepted

### Context
No routing engine (OSRM/GraphHopper/Directions API/pgRouting) existed. The citizen "safe route" screen needed real alternative routes without fabricating geometry or risk numbers.

### Decision
The client fetches real route alternatives from the free public OSRM demo server (`router.project-osrm.org`, no key). The backend accepts those candidate geometries and deterministically scores each against its own real hazard-zone and non-operational-road data (point-in-polygon + proximity sampling) — the backend remains the sole source of truth for risk; it never invents route shape.

### Rationale
No new backend dependency, no fabricated geometry, and risk stays computed from the same deterministic engine data used everywhere else in the app.

### Alternatives Considered
- **Self-hosted OSRM**: real server-side routing, but adds a Docker service/infrastructure — heavier than needed for this stage.
- **External Directions API (Mapbox/Google)**: adds API key cost/quota; deferred.

### Follow-up
`router.project-osrm.org` is explicitly a demo/evaluation instance per its own usage policy — a production deployment should self-host OSRM or move to a licensed provider.

---

## ADR-006: Use Docker PostgreSQL for the local application runtime

* **Date**: 2026-09-11
* **Status**: Accepted

### Context
The current application runs as a local Express API and React client. The intended development database is the bundled `postgres:16-alpine` Docker service, and the frontend must receive state through the API rather than a direct database or hosted-backend connection.

### Decision
Use `cline_backend/docker-compose.yml` as the local PostgreSQL runtime. Prisma connects using the local `DATABASE_URL` and `DIRECT_URL`; React calls the authenticated Express API only.

### Consequences
- `docker compose up -d`, Prisma migrations, and the seed command establish a repeatable local environment.
- A named Docker volume persists local data between restarts.
- Live provider data is fetched server-side and persisted as weather snapshots; frontend polling receives it through the API.
- Team members who need a shared production database will need a separately approved deployment plan; it is not silently substituted for local Docker.
