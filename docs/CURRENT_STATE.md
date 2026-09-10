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
- [x] **Frontend transport + demo-path wiring to `cline_backend`** — `client/` points at `:4000` with a JWT (`cs_token`) header hook and `{success,data}` envelope unwrap; login, government overview KPIs (15s poll), zone cascade (DRAIN-07 → RD-24 → HOSP), AI explanation, and operator approval (`POST /api/tasks`) wired. See PRs #8/#9.
- [x] **Multi-agent Incident-Response Orchestrator** — new top-level `agents/` (Risk Analyst, Cascade, Dispatch Planner, Comms, Validation) + `orchestration/` coordinator. Grounded (controlled action catalog, no invented assets/actions, engine-confidence ceiling), deterministic fallback so it runs offline with no API key, human-in-the-loop (PROPOSED plans → `POST /api/tasks`), persisted run state. Verified: `tsc --noEmit` clean, 3/3 orchestrator tests pass, end-to-end demo green. See `docs/ORCHESTRATION.md` and ADR-004. **Not yet wired into `cline_backend`** — runs standalone (`npm --prefix orchestration run demo`).
- [x] **Rescue Tactical Backend Engine** — a separate standalone Express service in `backend/` (port 4001, `backend/src/rescueServer.ts` + `backend/src/rescue/{rescueEngine,tacticalAi}.ts`) with its own AI dossier generator, serving the Rescue role. **`backend/` is active, not superseded** — it now runs alongside `cline_backend` (port 4000) as a second backend service, in addition to the pre-existing deterministic engine/AI modules under `backend/src/{engine,ai}`.

---

## Currently Working On
- Ready for backend team integration and shared live data feeds
- P4 AI explanation layer merged pending review (PR #7); needs a live smoke test of `POST /api/incidents/:id/explain` against local Docker PostgreSQL (`GEMINI_API_KEY` optional — deterministic fallback works without it)
- Local runtime standardized on Docker PostgreSQL (`cline_backend/docker-compose.yml`). Government HQ now requires the API JWT and refreshes PostgreSQL operational state every 15 seconds plus live Open-Meteo observations every 60 seconds.
- `origin/main`, `feat/agents-orchestration`, and this branch were consolidated onto `feature/climateshield-mvp` (2026-09-11): 2 conflicts resolved (`cline_backend/src/config/env.ts` — kept `gemini-2.5-flash` as the safe default plus optional Supabase vars; `docs/DECISIONS.md` — renumbered the orchestrator entry to ADR-004).
- Three backend services now coexist: `cline_backend` (port 4000, canonical Gov/Citizen API + P4 explain), `backend/` (port 4001, Rescue Tactical Engine + dossier AI), and the standalone `agents/`+`orchestration/` package (not yet wired to either). Reconciling these into one canonical backend is an open follow-up (see Next Tasks).

---

## Known Issues
- None. All 22 Stitch screens verified and operational.

---

## Next Tasks
- [ ] Await Hackathon Problem Statement (PS) release
- [ ] Finalize technology stack selections (Frontend, Backend, Frameworks)
- [ ] Initialize frontend and backend application boilerplate
- [x] Run PostgreSQL schema migrations and seed data through Docker Compose
- [ ] Decide whether `backend/` (Rescue, port 4001) stays a separate service long-term or gets ported into `cline_backend` for a single canonical backend
- [ ] Wire `agents/`+`orchestration/` into `cline_backend` (or a thin adapter) so the multi-agent plan is reachable from an API endpoint, not just the standalone demo
- [ ] Rotate `GEMINI_API_KEY` / `WEATHER_API_KEY` if they were ever shared outside `.env` (e.g. pasted in chat/tickets)

---

## Current Architecture
- Refer to `docs/ARCHITECTURE.md` (Docker PostgreSQL backend, modular agent orchestration).

---

## Agent / Workflow State
- Standard multi-agent team rules enabled via `AGENTS.md`.

---

## Database State
- Docker PostgreSQL is the local source of application state. Prisma migrations and seed data are applied from `cline_backend/`.

---

## Important Notes
- Always check `git status` and `git diff` before committing.
- Do not commit `.env` or personal tokens to Git.
