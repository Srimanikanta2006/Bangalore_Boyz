# ClimateShield — Citizen / Traveller Backend Plan (STAGE A)

**Status: PLAN ONLY — no application code modified. Awaiting confirmation before Stage B.**

Single backend (`cline_backend`), single PostgreSQL database. The citizen experience is added as a new role + namespaced endpoints + minimal additive schema. Government functionality, the Risk Engine, Cascade Engine and Task/Dispatch state machine remain untouched.

---

## 1. Phase 0 findings (verified against the actual repo)

**Stack**: Express 4 + TS, Prisma 6 (PostgreSQL/Supabase), Zod, JWT + bcryptjs, helmet/cors/rate-limit, vitest + supertest. Structured JSON logging. 54 existing endpoints, 68 passing tests.

**Verified gaps**: `Role` enum has no `CITIZEN`. No file/media storage exists (no multer/busboy/S3). No routing engine exists (no OSRM/GraphHopper/Directions; only road assets + an audited reroute *advisory*). No websockets. No PostGIS — geography must be computed in JS (haversine is fine at MVP scale: 4 zones, 19 assets, 12 incidents).

## 2. Feature → existing-system mapping

| Citizen feature (UI) | Reused as-is | Gap → minimal change |
|---|---|---|
| Citizen authentication | `auth.service`, JWT `authenticate`, `requireRole`, login/me | Add `CITIZEN` role + seed demo account |
| GPS location | client provides lat/lng per request | Transient only — not stored (except own reports/SOS) |
| Nearby hazards/warnings | `Hazard` model, `hazard.service` | distance util + citizen card sanitizer |
| Citizen live map | `map.service` GeoJSON builders, Zone/Hazard/Asset/Incident | public overlay variant (current `/api/map/overlays` exposes internal unit callsigns/departments) |
| Hazard detail | `GET /api/hazards/:id` (zone, measurements, source, startedAt) | `dataQuality` field + computed freshness |
| Nearby infrastructure | `InfrastructureAsset` (+ statuses, shelters, hospitals) | distance sort |
| Safe route selection | ROAD/BRIDGE assets + `operationalStatus`, zone risk, hazards | no routing engine — **decision required (§7)** |
| Route comparison / rerouting | same data, polling (no websockets) | deterministic re-score endpoint |
| Citizen hazard reporting | `Incident` triage workflow, `AuditLog`, `nextIncidentCode` | point coordinates, evidence, citizen category/verification, per-citizen history → **minimal `CitizenReport` model (§3)** |
| Photo evidence | — none exists | **minimal `ReportEvidence` + storage decision (§6)** |
| Emergency SOS | `Incident` (CRITICAL) + `Notification` | threat detail/status/ownership → **minimal `SosEvent` (§3)** |
| Citizen alerts | `Hazard`/`Incident`/assets computed live + `Notification` | computed nearby-alerts endpoint (no new model) |
| Report history | authenticated identity (`req.user.id`) | ownership-scoped query on `CitizenReport` |

**Why new models are justified** (rule: prove `Incident` cannot represent it): `Incident` is zone-anchored (no lat/lng), carries government SLA/state semantics, has no evidence link, no citizen verification lifecycle, and is created/triaged by operators. Stuffing nullable lat/lng + evidence + citizen category + citizen status + reporter scoping into `Incident` would pollute the government schema and every existing API contract. The three minimal models below keep the government contract intact — and each **auto-creates a linked `Incident`** so citizen reports still enter the existing triage/dispatch workflow (non-authoritative until an operator processes it).

## 3. Required schema changes (additive only; `prisma migrate dev`, no reset, no data loss)

1. `enum Role` **+= `CITIZEN`**
2. `enum CitizenReportCategory { FLASH_FLOOD ROAD_BLOCKED DOWNED_LINE EXTREME_HEAT WATER_MAIN LANDSLIDE_MUD STORM_DAMAGE OTHER }` (exact UI categories)
3. `enum CitizenReportStatus { SUBMITTED UNDER_REVIEW VERIFIED DISMISSED RESOLVED }`
4. `model CitizenReport`: id, `reportCode` (CR-###, unique), `reporterId → User`, category, description, **latitude/longitude** (report location), `zoneId → Zone` (derived server-side from point-in-polygon / nearest zone — never trusted from client), `reportedSeverity` (citizen's claim, non-authoritative), `observations Json?` (optional citizen-measured values, labeled non-authoritative), status (default SUBMITTED), `incidentId?` (auto-created linked Incident), createdAt/updatedAt, `evidence ReportEvidence[]`. Indexes: (reporterId, createdAt), zoneId, status.
5. `model ReportEvidence`: id, `reportId → CitizenReport` (cascade), mediaType (image/jpeg…), `storageType` (LOCAL_DISK | EXTERNAL_URL), storageRef, byteSize?, capturedAt?, latitude?, longitude?, description?, createdAt.
6. `enum SosThreat { MEDICAL FIRE_RESCUE FLOOD_BOAT HAZARD_GAS }`, `enum SosStatus { OPEN ACKNOWLEDGED DISPATCHED RESOLVED CANCELLED }`
7. `model SosEvent`: id, `sosCode` (SOS-###), `requesterId → User`, latitude/longitude, zoneId (derived), primaryThreat, `secondaryConditions Json?`, peopleAffected Int?, note?, status (default OPEN), `incidentId?` (auto-created CRITICAL Incident), createdAt/updatedAt.
8. `Hazard.dataQuality String @default("SYNTHETIC_DEMO")` — the smallest way to represent the requested taxonomy: `LIVE_OBSERVED | FORECAST | MODELED | ESTIMATED | SYNTHETIC_DEMO` (telemetry freshness is already derivable from `TelemetryReading.source + timestamp`).
9. **Seed additions**: `citizen@climateshield.demo` (role CITIZEN), 3-4 demo citizen reports across statuses + 1 resolved SOS, `dataQuality` backfilled to `SYNTHETIC_DEMO`.

**No changes to**: Incident, Task, RiskScore, CascadeEvent, DependencyEdge, Notification (reused as-is), or any existing index/model.

## 4. Authentication / authorization (no architecture change)

- Reuse the existing login/JWT/`authenticate`/`requireRole` stack untouched. `CITIZEN` is just a new enum value — **fail-closed by design**: no existing `requireRole(...)` list includes it, so every government write endpoint (dispatch, incident/hazard create, task status/verify, infrastructure actions, audit) automatically denies citizens.
- New tiny `denyCitizen` middleware applied to internal **read** endpoints citizens must not see: `/api/government/*`, `/api/response-center`, `/api/incidents*`, `/api/tasks*`, `/api/units*`, `/api/audit`, `/api/analytics/*`, `/api/simulations*`, `/api/departments*`, `/api/cascade/*`, `/api/map/overlays` (replaced for citizens by a public variant). All existing government roles are unaffected.
- Citizen-accessible (public-safety data): `/api/auth/*`, `/api/health`, `GET /api/hazards*`, `GET /api/zones*`, `GET /api/infrastructure*`, `GET /api/hotspots*`, `GET /api/map/assets|hazards|incidents`, plus all new `/api/citizen/*` endpoints.

## 5. Proposed endpoints (contracts will be added to docs/API.md)

| Method & path | Roles | Purpose |
|---|---|---|
| `POST /api/citizen/reports` | CITIZEN | Create report (validates category/coords, derives zone, creates linked `Incident` status NEW for operator triage, audit `CITIZEN_REPORT_SUBMITTED`) |
| `GET /api/citizen/reports` | CITIZEN | **Own** reports only (history: id, type, location, status, verification, timestamps, linked incident status) |
| `GET /api/citizen/reports/:id` | CITIZEN | Own report detail + evidence (404 on foreign id — no enumeration) |
| `GET /api/citizen/nearby?latitude&longitude&radiusKm` | CITIZEN | Nearby active hazards, public incidents, infrastructure, zones/flood-risk, closures, shelters — distance-sorted |
| `GET /api/citizen/alerts?latitude&longitude` | CITIZEN | Computed nearby warnings (flood/heat/storm/closure) + own `Notification` rows — public info only |
| `GET /api/citizen/map/overlays` | CITIZEN | Public GeoJSON layers (hazards, floodZones, heatZones, roadClosures, shelters/cooling, public incidents) — **no unit callsigns/departments/telemetry internals** |
| `POST /api/citizen/sos` | CITIZEN | SOS → `SosEvent` + auto-created CRITICAL `Incident` + Notifications to Emergency Management operators + audit |
| `GET /api/citizen/sos` | CITIZEN | Own SOS history |
| `PATCH /api/citizen-reports/:id/status` | GOV | Operator triage: SUBMITTED→UNDER_REVIEW→VERIFIED/DISMISSED/RESOLVED (syncs linked incident; audit) |
| `POST /api/routes/safe` | CITIZEN+GOV | **Stage F, pending approval (§7)** — score client-supplied candidate routes |
| `POST /api/routes/recalculate` | CITIZEN+GOV | Re-score current route against latest hazard/road data (polling-based rerouting) |

Response envelope `{success:true,data}` and error envelope unchanged. New code follows the existing routes → controllers → services → validators structure.

## 6. DECISION REQUIRED — photo evidence storage

No storage mechanism exists in the repo. Options:
- **A) URL-only** — client supplies a hosted URL; backend stores the reference. Zero backend storage; frontend must host uploads.
- **B) Local disk upload (recommended for MVP)** — upload saved to `cline_backend/uploads/evidence/<uuid>.<ext>`, served read-only via `express.static` at `/media/evidence`; DB row stores `storageRef` + metadata. Limits: jpg/png/webp, ≤5 MB, max 3 per report. No external provider, no binaries in Postgres. Requires one small dependency (multer) — will confirm before adding.
- **C) Supabase Storage** — `storageRef` = Supabase URL; needs your project config/keys.

## 7. DECISION REQUIRED — routing approach

No routing engine exists. Per the rules (no OSRM/GraphHopper/Google/Mapbox Directions/pgRouting without approval; no fabricated geometry):
- **1) Client-supplied candidate routes (recommended MVP)** — the frontend (MapLibre/its own directions) sends 2-3 candidate polylines; the backend deterministically scores each against DB hazards, blocked/non-operational roads and zone risk → per-route `riskScore`, blocked segments, exposure summary, recommended route + `POST /api/routes/recalculate` for dynamic rerouting. No new dependency, no fabricated geometry, backend remains the source of truth for risk.
- **2) Self-hosted OSRM** — real server-side street routing; adds a Docker service + dependency (heavier).
- **3) External Directions API** (Mapbox/Google) — adds API key cost/quota.

## 8. Data quality / freshness (Phase 5)

Every environmental value returned to citizens carries: `source` (existing `Hazard.source` / `TelemetryReading.source`), `dataQuality` (new field: LIVE_OBSERVED | FORECAST | MODELED | ESTIMATED | SYNTHETIC_DEMO) and computed freshness (minutes since `startedAt`/`timestamp` + status). MVP seed is honestly labeled `SYNTHETIC_DEMO`. Absent DB values are returned `null` — never invented.

## 9. External real-data sources (Stage G — none in MVP; each needs approval + geography check)

Candidates to be documented before any integration: Open-Meteo (global weather, no key, observed+forecast), NOAA/NWS (US only), USGS water services (US), OpenStreetMap/Overpass (global roads, no key), browser GPS (client). For each: provider, endpoint, coverage, update frequency, fields, key requirements, rate limits, fallback behavior. No provider is added without your approval for the target geography.

## 10. Security & privacy

- Citizen GPS is **transient** for queries; stored only on the citizen's own reports/SOS (required for the workflow) and scoped to that citizen.
- Proposed 1-line privacy improvement: request logger logs `req.path` only (drops query strings) so coordinates never appear in logs.
- Ownership scoping on all citizen reads; foreign ids → 404 (no enumeration). Citizens never see other citizens' private reports.
- Never trusted from clients: severity (stored as non-authoritative `reportedSeverity`), observations, zone (derived server-side), risk scores, cascade (unchanged engines).
- SOS creates an **internal** ClimateShield emergency event visible to authorized operators — it does **not** contact real emergency services (stated in the response and docs). No external emergency-dispatch integration without explicit approval.
- Alerts carry public-safety info only (hazards, closures, shelters) — never deployments, SLAs, audit or internal boards.

## 11. Implementation order (per your stages; tests run + report + STOP after each)

- **Stage B**: `CITIZEN` role + migration + seed account + `denyCitizen` guard + auth/authorization tests (incl. negative: citizen cannot dispatch/verify/create incidents).
- **Stage C**: `utils/geo.ts` (haversine, point-in-zone) + `/api/citizen/nearby` + `/api/citizen/map/overlays` + `Hazard.dataQuality` + tests.
- **Stage D**: `CitizenReport` + `ReportEvidence` + citizen report endpoints + GOV triage endpoint + seed demo reports + evidence storage per §6 decision + tests.
- **Stage E**: `SosEvent` + SOS endpoints + operator notifications + `/api/citizen/alerts` + tests.
- **Stage F**: routing per §7 decision + tests.
- **Stage G**: approved external data sources.
- **Stage H**: full regression (existing 68 tests + new suites), typecheck, build, README/API.md updates, `CITIZEN_BACKEND_IMPLEMENTATION.md`.

## 12. Compatibility guarantees

All 68 existing tests keep passing; no existing endpoint contract changes; schema changes are additive only (migration, no reset); Risk/Cascade/Task engines untouched; single server + single database throughout.

## 13. Open decisions blocking Stage B+

1. Evidence storage: **A / B (recommended) / C** (§6)
2. Routing approach: **1 (recommended) / 2 / 3** (§7)
3. Confirm the §4 `denyCitizen` endpoint list (or adjust)
