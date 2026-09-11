# Current Project State

This file acts as the live status dashboard for the project. Every team member and AI coding tool must update this file upon completing significant milestones.

---

## Overview
* **Project Name**: Bangalore_Boyz
* **Current Phase**: Initial Repository Setup & Foundation Architecture
* **Last Updated**: 2026-09-10

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
- [x] Reshaped mock data layer to match Contracts 1-4 (`explain-response.json`, `tasks-mock-response.json`, `hotspots.json`)
- [x] Surfaced Contract 2 P4 AI explanation in exact 8 MVP Priority Order fields in `zone_detail.html` & `overview.html`
- [x] Implemented Contract 3 Operator Approval Flow (`data-action="approve-recommendation"`) generating payload for P1 Task API
- [x] Enforced zero direct AI provider API key exposure in browser code
- [x] Updated `NAVIGATION_MAP.md` with Data Contracts specification for P1/P2/P4 teammates
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
- [x] **Frontend transport + demo-path wiring to `cline_backend`** — `client/` points at `:4000` with a JWT (`cs_token`) header hook and `{success,data}` envelope unwrap; login, government overview KPIs (15s poll), zone cascade, AI explanation, and operator approval (`POST /api/tasks`) wired. See PRs #8/#9.
- [x] **Multi-agent Incident-Response Orchestrator** — top-level `agents/` (Risk Analyst, Cascade, Dispatch Planner, Comms, Validation) + `orchestration/` coordinator. Grounded, deterministic fallback, human-in-the-loop, persisted run state. Wired to `cline_backend` as `POST /api/incidents/:id/orchestrate`.
- [x] **Rescue Tactical Backend Engine** — separate Express service in `backend/` (port 4001, `backend/src/rescueServer.ts`) serving Rescue role with AI mission dossiers.
- [x] **Complete citizen workflow built end-to-end** on branch `feature/citizen-workflow` (real data throughout): `CITIZEN` Prisma role + fail-closed access guard; real JWT login with server-driven role redirect; `GET /api/citizen/nearby` (live Open-Meteo weather & air quality, active hazards, nearby public infra, safety index); `GET /api/citizen/alerts` (computed advisories); `GET /api/citizen/hazards/:id`; `POST /api/citizen/reports` (`CitizenReport`/`ReportEvidence` models with photo evidence); `POST /api/citizen/sos` (`SosEvent` model, auto-CRITICAL incident, operator notifications); `POST /api/citizen/routes/score` (OSRM alternatives scored against real hazard/road data).
- [x] **Phase 3 Batch 1: Security Foundation Completed** — Tiered rate limiting (`express-rate-limit` for auth, SOS panic throttling, report submission, and global API protection); object-level authorization & anti-enumeration on citizen reports (`GET /api/citizen/reports/:id`) and SOS events (`GET /api/citizen/sos/:id`); sanitization of error handlers (blocking path, token, or SQL leakage); hardened Helmet security headers; seamless client role synchronization on `LoginPage.tsx` (Direct Launch) and `ScreenSwitcher.tsx` to eliminate 403s and redirect loops. 100% test pass rate (165/165 passing).
- [x] **Phase 3 Batches 2 & 3: Reliability, Data Quality, Integrity & Audit Trail Completed** — (1) External API resilience: `weather.service.ts` and `airQuality.service.ts` now use 3.5s timeout + 1 retry with backoff + stale-cache fallback with `dataFreshness: "live"|"stale"` and `confidence: "HIGH"|"MEDIUM"` flags. (2) Citizen report and SOS deduplication: rolling 5-min/100m window for reports, 3-min window for SOS — returns existing active record (HTTP 200) on duplicate. Accepts optional `Idempotency-Key` header. (3) Atomic Prisma transactions: citizen report creation + incident link + evidence rows wrapped in `prisma.$transaction`; SOS + incident + operator notifications also atomic. (4) Audit trail: `oldState`/`newState` fields explicitly recorded in `AuditLog.metadata` on every incident/task/unit/report/SOS transition. (5) Alert delivery lifecycle: `PATCH /api/notifications/alerts/:id/acknowledge` endpoint for `SENT→ACKNOWLEDGED/ESCALATED` with audit. 181/185 tests pass (4 skipped — DB-conditional integration guards).

---

## Currently Working On
- Ready for backend team integration and shared live data feeds
- Local runtime standardized on Docker PostgreSQL (`cline_backend/docker-compose.yml`) / Supabase. Government HQ requires API JWT and refreshes PostgreSQL operational state every 15s plus live Open-Meteo observations every 60 seconds.
- Citizen workflow (`feature/citizen-workflow`) integrated end-to-end.
- Multi-agent orchestration and notification pipeline active in `cline_backend`.

---

## Known Issues
- None on the government/rescue side. All 22 Stitch screens verified and operational.
- Citizen workflow: OSRM routing uses the free public demo server (`router.project-osrm.org`), which is rate-limited/evaluation-only per its own usage policy — fine for the hackathon demo, not for production traffic. Route/hazard-detail map backgrounds are still decorative chrome (not a live Leaflet tile map); all numbers/labels on them are real.

---

## Next Tasks
- [x] Run PostgreSQL schema migrations and seed data through Docker Compose
- [x] Wire `agents/`+`orchestration/` into `cline_backend` as `POST /api/incidents/:id/orchestrate`
- [x] Add notification pipeline for risk threshold crossings (`POST /api/zones/:id/notify` and `GET /api/notifications`)
- [ ] Finalize hackathon demo presentation and live stream verification
- [ ] Confirm shared database environment variables
- [ ] Government team: continue overview/response-center/simulator work in parallel; Rescue team: continue tactical/mission workflow in parallel (both unaffected by the citizen branch — no shared file conflicts, additive schema only)

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
