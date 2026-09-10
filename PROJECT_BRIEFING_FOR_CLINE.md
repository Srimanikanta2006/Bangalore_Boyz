# ClimateShield — Comprehensive Project Briefing & Technical Architecture Guide for Cline

> **Purpose**: This document provides a complete, authoritative overview of the **ClimateShield** project architecture, team boundaries, implemented features, live backend integration, data adapter contracts, and operational guidelines. Use this context inside Cline to research features, debug issues, and generate precise, actionable prompts for Antigravity to execute.

---

## 1. Project Overview & Vision

**ClimateShield** is a precision climate risk and emergency mobility platform designed to protect urban centers from rapid-onset climate hazards (flash floods, urban inundation, extreme heat, grid failure).

The application operates across 3 distinct product interfaces:
1. **Government EOC Command Center** (`frontend/government/*`): Desktop/tablet dashboard for EOC directors and city operators to monitor city resilience, inspect causal cascade paths, view historical climate hotspots, run disaster simulations, and approve AI-recommended field dispatch tasks.
2. **Rescue Tactical Interface** (`frontend/rescue/*`): Mobile/tablet field console for tactical response units to navigate hazards, view mission dossiers, and submit status reports.
3. **Citizen Mobility Interface** (`frontend/citizen/*`): Mobile web app for citizens to view real-time flood/heat alerts, select safe rerouted navigation paths, submit SOS requests, and report local hazards.

---

## 2. Team Structure & Boundaries

```text
                 +-------------------------------------------------+
                 |                USER / OPERATOR                  |
                 +-------------------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
| FRONTEND & DATA ADAPTER LAYER (Antigravity & Stitch UI)                           |
| - Owns Citizen, Government, and Rescue interfaces                                 |
| - Maps backend schemas to P1/P2/P4 Contracts 1-4 via frontend/services/adapters.js |
| - Enforces Human-in-the-Loop operator task approval                               |
+-----------------------------------------------------------------------------------+
       |                                      |                                   |
       v                                      v                                   v
+-----------------------+   +----------------------------------+   +----------------------+
| P1: BACKEND & INFRA   |   | P2: RISK ENGINE & SIMULATOR      |   | P4: EXPLAINABILITY   |
| - Users & Auth (JWT)  |   | - Deterministic Risk Scoring     |   | - AI Reasoning Engine|
| - Task Creation API   |   | - Causal Cascade Graph           |   | - Natural Language   |
| - Persistence (DB)    |   | - Hazard Simulator (/simulate)   |   |   Summaries          |
+-----------------------+   +----------------------------------+   +----------------------+
```

---

## 3. Current Implementation Status & Accomplishments

### A. Centralized Service Architecture
- `frontend/shared/config.js`:
  - `API_BASE_URL`: `http://172.19.39.31:4000/api` (Live backend running on port 4000 over local Wi-Fi).
  - `DATA_MODE`: `"live"` (with graceful fallback to mock JSON if disconnected).
  - `POLL_INTERVAL_MS`: `15000` (15-second real-time telemetry auto-refresh loop).
- `frontend/services/api.js`:
  - Centralized authenticated fetch wrapper (`window.ApiClient.authenticatedFetch`).
  - Dynamic login (`POST /auth/login`) storing JWT in `sessionStorage` / `localStorage`.
  - Automatically attaches `Authorization: Bearer <token>` to protected API requests.
- `frontend/services/governmentApi.js`:
  - Centralized Government domain API client covering all 30+ Postman collection endpoints.
- `frontend/services/adapters.js`:
  - Data normalizers isolating real backend field names from frontend UI contract templates.

### B. Integration Contracts Implemented
- **Contract 1 (AI Explainability)**: Natural language cascade explanations route through `POST /api/explain`. Zero direct client-side AI provider calls.
- **Contract 2 (MVP Priority Order Fields)**: Renders 8 core fields on `zone_detail.html` and `overview.html`:
  1. `asset_id` (`#p4-target-asset-id`)
  2. `risk_score` (`#p4-risk-score`)
  3. `failure_probability` (`#p4-failure-probability`)
  4. `cascade_path` (`#p4-cascade-path`)
  5. `recommended_actions` (`#p4-recommended-action`)
  6. `priority` (`#p4-action-priority`)
  7. `confidence` (`#p4-confidence`)
  8. `uncertainties` (`#p4-uncertainties`)
- **Contract 3 (Human Operator Task Approval)**:
  - Operator click on `[data-action="approve-recommendation"]` calls `window.Adapters.adaptContract3ToTaskPayload()` and POSTs to `/api/tasks`.
  - Button text updates to `Task Dispatched ✓` in emerald green.
- **Contract 4 (Historical Hotspots)**:
  - Hotspot vulnerability clusters fetched from `GET /api/hotspots` and rendered into trend metrics on `critical_assets.html`.

### C. Live Verification Passed (31/31 Endpoints)
- **Status**: 100% of tested backend endpoints (`/auth/login`, `/health`, `/government/overview`, `/incidents`, `/tasks`, `/units`, `/infrastructure`, `/zones`, `/hazards`, `/map/*`, `/hotspots`, `/departments`) return `HTTP 200 OK` or `HTTP 201 Created`.

---

## 4. Operational Rules & Technical Constraints

1. **Zero UI Redesign Rule**: Never alter existing Stitch HTML templates, visual styling, Tailwind utility classes, or page layouts unless explicitly instructed.
2. **Role Isolation**: Modifications to Government pages (`frontend/government/*`) must NEVER touch or break Citizen (`frontend/citizen/*`) or Rescue (`frontend/rescue/*`) pages.
3. **No Direct AI Provider Calls**: Browser JS must never invoke Gemini or OpenAI directly. All AI content flows through backend endpoints.
4. **No Hardcoded Tokens / Secrets**: Never commit JWT tokens, passwords, or API keys to Git.
5. **Git Hygiene**: Work on feature branch `feature/climateshield-mvp`. Run `git diff --check` before completing tasks. Do not auto-commit without user approval.

---

## 5. How Cline Should Formulate Prompts for Antigravity

When Cline finishes researching a task or debugging a feature, it should generate prompts for Antigravity using this exact structure:

```markdown
### Antigravity Task Prompt

**Objective**: [Clear 1-sentence goal]

**Files to Modify / Create**:
- `path/to/file.ext`

**Key Requirements**:
1. [Requirement 1]
2. [Requirement 2]

**Integration Constraints**:
- Preserve existing Stitch UI markup and styles.
- Use `window.GovernmentApi` / `window.Adapters` for data flow.
- Ensure `git diff --check` passes with zero formatting errors.

**Verification Command**:
`python scripts/verify_all_30plus_endpoints.py`
```
