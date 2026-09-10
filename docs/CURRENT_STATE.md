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
- [x] Supabase team multi-developer workflow documented
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
- P4 AI explanation layer merged pending review (PR #7); needs a live smoke test of `POST /api/incidents/:id/explain` once pointed at the shared Supabase DB (`GEMINI_API_KEY` optional — deterministic fallback works without it)
- **Citizen workflow (`feature/citizen-workflow`) built and tested against a local dev Postgres; its 3 additive migrations (`add_citizen_role`, `add_citizen_reports_and_sos`) still need to be applied to the shared Supabase project once a working `DATABASE_URL`/`DIRECT_URL` is confirmed** (the connection string shared in chat had an unreplaced `[YOUR-PASSWORD]` placeholder / pointed to an unreachable host as of this writing) — see Database State below.

---

## Known Issues
- None on the government/rescue side. All 22 Stitch screens verified and operational.
- Citizen workflow: OSRM routing uses the free public demo server (`router.project-osrm.org`), which is rate-limited/evaluation-only per its own usage policy — fine for the hackathon demo, not for production traffic. Route/hazard-detail map backgrounds are still decorative chrome (not a live Leaflet tile map); all numbers/labels on them are real.

---

## Next Tasks
- [ ] Confirm a working shared Supabase `DATABASE_URL`/`DIRECT_URL` and run `prisma migrate deploy` (additive only) for the citizen workflow's 3 migrations, then upsert (not full-reseed) a citizen demo account there
- [ ] Rotate the Supabase service-role key that was pasted into a team chat (not used by this backend, which is JWT-based, but should be rotated as good hygiene)
- [ ] Merge `feature/citizen-workflow` after review
- [ ] Government team: continue overview/response-center/simulator work in parallel; Rescue team: continue tactical/mission workflow in parallel (both unaffected by the citizen branch — no shared file conflicts, additive schema only)

---

## Current Architecture
- Refer to `docs/ARCHITECTURE.md` (Shared Supabase backend, modular agent orchestration).
- Auth: backend-issued JWT for **all** roles including `CITIZEN` (Supabase is the Postgres host only, not an auth provider — see ADR-003).

---

## Agent / Workflow State
- Standard multi-agent team rules enabled via `AGENTS.md`.

---

## Database State
- Supabase shared project connected in principle; a working connection string for migrations is still pending confirmation (see Next Tasks). Local development/testing for the citizen workflow used an isolated Docker Postgres instance; the same additive migrations apply cleanly to the shared project once its connection string works.

---

## Important Notes
- Always check `git status` and `git diff` before committing.
- Do not commit `.env` or personal tokens to Git.
