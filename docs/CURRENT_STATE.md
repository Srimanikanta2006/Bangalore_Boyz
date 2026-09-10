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

---

## Currently Working On
- Ready for backend team integration and shared live data feeds
- P4 AI explanation layer merged pending review (PR #7); needs a live smoke test of `POST /api/incidents/:id/explain` (`GEMINI_API_KEY` optional — deterministic fallback works without it)
- Local runtime standardized on Docker PostgreSQL (`cline_backend/docker-compose.yml`) / Supabase. Government HQ now requires the API JWT and refreshes PostgreSQL operational state every 15 seconds plus live Open-Meteo observations every 60 seconds.
- Citizen workflow (`feature/citizen-workflow`) built and integrated end-to-end.

---

## Known Issues
- None on the government/rescue side. All 22 Stitch screens verified and operational.
- Citizen workflow: OSRM routing uses the free public demo server (`router.project-osrm.org`), which is rate-limited/evaluation-only per its own usage policy — fine for the hackathon demo, not for production traffic. Route/hazard-detail map backgrounds are still decorative chrome (not a live Leaflet tile map); all numbers/labels on them are real.

---

## Next Tasks
- [x] Run PostgreSQL schema migrations and seed data
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
