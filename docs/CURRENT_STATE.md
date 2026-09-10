# Current Project State

This file acts as the live status dashboard for the project. Every team member and AI coding tool must update this file upon completing significant milestones.

---

## Overview
* **Project Name**: Bangalore_Boyz (ClimateShield — urban climate risk / flood-resilience platform)
* **Current Phase**: Phase 3 hardening complete on `feature/gov-rescue-wiring` (chunks A0–J); PR not yet opened
* **Last Updated**: 2026-09-11

---

## Completed
- [x] Repository initialization on GitHub (`main` branch)
- [x] Reorganized `frontend/` into 3 structured role directories (`citizen/`, `government/`, `rescue/`)
- [x] Built shared vanilla JS shell (`shared/nav.html`, `shared/app.js`, `shared/app.css`) with nav partial injection
- [x] Built pluggable mock data layer (`frontend/data/*.json`) with `shared/config.js` (`DATA_MODE = "mock" | "live"`)
- [x] Wired end-to-end judge demo click paths across all 24 screens
- [x] Fixed sidebar overlap, desktop header alignment, and role navigation isolation
- [x] Restored `response_center.html` to pristine layout and removed duplicate header buttons
- [x] Built interactive sliding drawer Command Center sidebar with header toggle `[ ☰ ]`
- [x] Created `NAVIGATION_MAP.md` site graph documentation
- [x] Global AI coding agent instructions created (`AGENTS.md`)
- [x] Standard project documentation hierarchy created (`docs/`)
- [x] Environment variable template created (`.env.example`)
- [x] Security-hardened Git ignore rules configured (`.gitignore`)
- [x] Docker PostgreSQL local development workflow documented
- [x] Completed Phase 1: Decoupled Citizen and Rescue roles, eliminated cross-role routing confusion, built `CitizenActiveNavPage.tsx` (Stitch Screen 23), and updated navigation topologies across all mobile views
- [x] Completed Master Stitch Reconstruction: All 22 Stitch screens faithfully reconstructed in React + Tailwind across 4 isolated roles (Citizen: 8, Rescue: 6, Gov Mobile: 3, Gov HQ: 5)
- [x] Deleted 17 obsolete / generic prototype admin pages (`DashboardPage`, `RiskMapPage`, `AssetsPage`, etc.)
- [x] Frontend TypeScript build verified with 0 errors (`npm --prefix client run build`)
- [x] Background dev servers healthy on port 5000 (Node API) and port 5173 (Vite Client)
- [x] **P4 AI (grounded Gemini explanation layer) consolidated into `cline_backend`** — new `cline_backend/src/ai/` (schemas, controlled action catalog, runtime validation, deterministic fallback, Gemini provider) + `explainAdapter.ts` bridging the deterministic engine's verified facts (`getIncidentCascade`) into a grounded `ExplainRequest`. Exposed as `POST /api/incidents/:id/explain` (auth). No second risk engine added (cline_backend's deterministic engine remains the single source of truth); no websocket (frontend uses polling). Verified: `tsc --noEmit` clean, 45/45 unit tests pass, zero new dependencies. See PR #7 (`feat/p4-consolidate-server`).
- [x] **Complete citizen workflow built end-to-end** on branch `feature/citizen-workflow` (real data throughout, zero fabricated values): `CITIZEN` Prisma role + fail-closed access guard; real JWT login with server-driven role redirect (`client/src/auth/`); `GET /api/citizen/nearby` (live Open-Meteo weather + new Open-Meteo Air-Quality integration, active hazards, nearby public infra, computed safety index/corridor status); `GET /api/citizen/alerts` (computed advisories); `GET /api/citizen/hazards/:id` (reuses the unmodified cascade engine); `POST /api/citizen/reports` (new `CitizenReport`/`ReportEvidence` models, multer local-disk photo evidence, auto-links a government `Incident`); `POST /api/citizen/sos` (new `SosEvent` model, auto-CRITICAL `Incident`, operator `Notification` fan-out, explicit "not a 911/112 replacement" disclaimer); `POST /api/citizen/routes/score` (real OSRM route alternatives scored against real hazard/road DB data, no fabricated geometry). All 7 citizen Stitch pages (`client/src/pages/stitch/Citizen*`, `AlertsFeedPage`, `HazardReportPage`, `SosEmergencyPage`, `LoginPage`) rewired to this real data — every `<Mock>` value either wired to a real field or removed. See `cline_backend/docs/CITIZEN_BACKEND_IMPLEMENTATION.md` and `docs/DECISIONS.md` (ADR-003/004/005) for full detail. Verified: backend 145/149 tests passing (4 skipped only when no DB is reachable), `tsc --noEmit` clean, client `npm run build` clean.
- [x] **Chunks A0–J complete on `feature/gov-rescue-wiring`** (full plan in `docs/MASTER_PLAN.md`, branch `docs/master-plan`):
  - **A0**: Fixed a real auth regression (two unsynced token stores, no-auth "Direct Launch" bypass buttons, unguarded Gov Mobile/Rescue routes) — unified on the single existing JWT/`RequireAuth` system.
  - **A/B/C**: Wired all remaining Gov HQ, Gov Mobile, and all 6 Rescue pages to real backend endpoints (response center, simulator, task lifecycle, critical asset monitor) — zero fabricated data remaining on these screens.
  - **D**: Citizen "My Activity" page + entry points so citizens see their own report/SOS resolution status.
  - **E**: Open-Meteo Flood/GloFAS river-discharge integration on the citizen nearby snapshot.
  - **F/F2**: Static, fully-cited Cyclone Hudhud (2014, Visakhapatnam, AP) reference panel + CAP 1.2 XML alert export. **Scope correction found live**: ReliefWeb API v2 requires a registered `appname` we don't have (confirmed `403`) and no working public SACHET feed URL exists — both were dropped rather than fabricated; see `docs/MASTER_PLAN.md` for the full correction.
  - **G**: Gemini Vision citizen-photo triage (non-authoritative), real statistical risk-trend forecasting (OLS linear regression over `WeatherSnapshot` history), real clustering-derived hotspots (single-linkage spatial clustering over `HistoricalEvent` rows).
  - **H**: Async hazard pipeline (BullMQ + Redis) — risk recompute → notification fan-out → report generation, with a verified inline fallback when Redis isn't configured.
  - **I**: `/metrics` (Prometheus text), rate limiting extended to citizen SOS/report endpoints, a real notification outbox/retry-backoff pattern (honestly `NOT_CONFIGURED` — no SMS/push provider key available, never a fabricated "sent" status).
  - **J**: `docs/RISK_METHODOLOGY.md`, `docs/SECURITY.md`, `docs/FAILURE_MODES.md`, and a new Deployment & Scalability section in `docs/ARCHITECTURE.md`.
  - Verified throughout: backend 204/208 tests passing (4 skipped only when no DB reachable), `tsc --noEmit` clean on both client and backend, client `npm run build` clean (~478 kB bundle).

---

## Currently Working On
- `feature/gov-rescue-wiring` is complete (chunks A0–J) but not yet merged/PR'd into `main` — no `gh` CLI available in this environment, so a PR must be opened manually via the GitHub compare URL.
- `docs/master-plan` branch holds `docs/MASTER_PLAN.md` (the full chunk plan + honest scope corrections) and also needs merging/reference.
- Shared Supabase DB connection is not yet confirmed working by the user; local dev currently runs against Docker Postgres (`climateshield-pg`, port 5433) as a workaround.
- Optional/stretch items not yet started: Razorpay test-mode monetization doc, a real Visakhapatnam OSM import (would let the Cyclone Hudhud case study anchor to real local geometry instead of only a text panel).

---

## Known Issues
- None on the government/rescue side. All screens verified and operational against real backend data.
- Citizen workflow: OSRM routing uses the free public demo server (`router.project-osrm.org`), which is rate-limited/evaluation-only per its own usage policy — fine for the hackathon demo, not for production traffic.
- ReliefWeb API v2 requires a registered `appname` (confirmed via a live `403` test) — not integrated; SACHET's CAP feed has no confirmed working public URL — not integrated. Both are documented corrections in `docs/MASTER_PLAN.md`, not silent gaps.
- External notification delivery (SMS/push) has no provider key configured — every delivery attempt is honestly recorded `NOT_CONFIGURED` (see `docs/FAILURE_MODES.md` §4); in-app notifications are unaffected.
- `/metrics` is process-local/in-memory (resets on restart) — fine for a single-instance MVP, documented upgrade path in `docs/ARCHITECTURE.md`.

---

## Next Tasks
- [x] Run PostgreSQL schema migrations and seed data
- [ ] Confirm shared database environment variables (real, reachable `DATABASE_URL`/`DIRECT_URL`, no placeholder password)
- [ ] Open a PR for `feature/gov-rescue-wiring` -> `main` (manual GitHub compare URL, no `gh` CLI in this environment)
- [ ] Merge/reference `docs/master-plan` branch's `docs/MASTER_PLAN.md`
- [ ] Optional stretch: Razorpay test-mode monetization doc, real Visakhapatnam OSM import

---

## Current Architecture
- Refer to `docs/ARCHITECTURE.md` (Modular backend, local Docker PostgreSQL / Supabase, modular agent orchestration).
- Auth: backend-issued JWT for all roles including `CITIZEN` and `GOVERNMENT_OPERATOR`.

---

## Agent / Workflow State
- Standard multi-agent team rules enabled via `AGENTS.md`.

---

## Database State
- Docker PostgreSQL is the primary local source of application state (`cline_backend/docker-compose.yml`), with Prisma migrations and seed data applied from `cline_backend/`. The same additive schema applies to Supabase.

---

## Important Notes
- Always check `git status` and `git diff` before committing.
- Do not commit `.env` or personal tokens to Git.
