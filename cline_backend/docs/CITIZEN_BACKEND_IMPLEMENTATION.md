# ClimateShield — Citizen / Traveller Backend: Implementation Summary

**Status: Stages B-F complete.** Implements `docs/CITIZEN_BACKEND_PLAN.md` end to end (Stage G — new external providers beyond what's listed below — was not needed; Stage H is this document).

Branch: `feature/citizen-workflow`. Single backend (`cline_backend`), single PostgreSQL database, additive-only schema changes. Government functionality, the Risk Engine, Cascade Engine, and Task/Dispatch state machine are **untouched** — reused, never modified.

## What was built, stage by stage

**Stage B — Role + guard**
- `Role` enum `+= CITIZEN` (migration `add_citizen_role`).
- `blockCitizenFromInternal` (app-level, `src/middleware/auth.ts`) denies CITIZEN accounts on internal read prefixes (`/api/incidents*`, `/api/tasks*`, `/api/units*`, `/api/audit`, `/api/analytics/*`, `/api/simulations*`, `/api/departments*`, `/api/cascade/*`, `/api/response-center`, `/api/overview`, `/api/map/overlays`, `/api/map/units`). Government write endpoints were already fail-closed (no `requireRole()` list includes `CITIZEN`).
- Seeded `citizen@climateshield.demo` (no department).

**Stage C — Nearby + map data + freshness**
- `src/utils/geo.ts` (haversine, point-in-polygon) already existed and was reused, not duplicated.
- `GET /api/citizen/nearby` composes live Open-Meteo weather + **new Open-Meteo Air-Quality integration** (`src/services/airQuality.service.ts`) + containing zone + nearby public infrastructure + active hazards into a computed `safety` index and `corridorStatus`.
- `Hazard.dataQuality` already existed (added in an earlier PR) — reused as-is.

**Stage D — Citizen hazard reporting**
- Additive models: `CitizenReport`, `ReportEvidence` (+ enums `CitizenReportCategory`, `CitizenReportStatus`, `EvidenceStorageType`) — migration `add_citizen_reports_and_sos`.
- `POST /api/citizen/reports` (multipart, up to 3 files) derives the zone **server-side** via point-in-polygon (never trusts client-supplied zone/severity), and auto-creates a linked `Incident` via the **existing, unmodified** `createIncident()` — so citizen reports enter the same triage/dispatch pipeline as any operator-reported incident.
- Evidence storage decision: **Option B (local disk)**, as pre-approved. `multer` (new, single, small dependency) writes to `cline_backend/uploads/evidence/<uuid>.<ext>` (jpg/png/webp, ≤5MB, max 3/report), served read-only via `express.static` at `/media/evidence`. `uploads/` is git-ignored.
- Ownership-scoped reads: `GET /api/citizen/reports`, `GET /api/citizen/reports/:id` (404 on a foreign id — no enumeration).

**Stage E — Emergency SOS**
- Additive model: `SosEvent` (+ enums `SosThreat`, `SosStatus`) in the same migration as Stage D.
- `POST /api/citizen/sos` always creates a **CRITICAL** linked `Incident` and notifies every `GOVERNMENT_OPERATOR`/`DISPATCHER`/`ADMIN` via the existing `Notification` model (best-effort — a notification failure never blocks the SOS itself). Every response carries an explicit `disclaimer` that this is an **internal ClimateShield alert only**, not a 911/112 integration (none exists).
- `GET /api/citizen/sos` — own history only.

**Stage F — Safe routing (per §7 decision: option 1)**
- No routing engine was built. `POST /api/citizen/routes/score` accepts client-supplied candidate route geometries (frontend fetches real alternatives from the free public OSRM demo server) and deterministically scores each against **real** backend data: active hazard zones (point-in-polygon) and non-operational roads/bridges (proximity, ≤300m) on up to 40 evenly-sampled points per route. Returns `riskScore`/`riskLevel`/`hazardZonesHit`/`blockedRoadsHit`/`explanation` per route and a `recommendedIndex`. The backend never invents geometry — only risk.

**Stage G — external data sources actually used**
| Provider | Endpoint | Key? | Used for |
|---|---|---|---|
| Open-Meteo | `api.open-meteo.com/v1/forecast` | No | Live weather (already existed, government side) |
| Open-Meteo Air Quality | `air-quality-api.open-meteo.com/v1/air-quality` | No | US AQI + PM2.5/PM10 for the citizen map (new) |
| OpenStreetMap/Overpass | via `import-chennai.ts` | No | Real Chennai zones/roads/infrastructure (already existed) |
| OSRM (public demo) | `router.project-osrm.org` | No | Route alternatives, **frontend-only** call (demo-tier; not for production traffic — a production deployment should self-host OSRM or use a licensed provider per §7 options 2/3) |
| Nominatim (OSM) | `nominatim.openstreetmap.org/reverse` | No | Reverse geocoding for citizen-facing addresses, **frontend-only**, best-effort/nullable |
| Browser Geolocation | — | No | Client GPS, with a fixed demo-zone fallback when denied/unavailable |

## Frontend (client/)

- `src/auth/` — real JWT login/session (`AuthProvider`, `RequireAuth`), replacing the fully-mocked `LoginPage`.
- `src/citizen/` — `api.ts` (typed client for every endpoint above), `geo.ts`/`useGeoResource.ts` (shared GPS+fallback hook), `reverseGeocode.ts`, `osrm.ts`.
- All 7 citizen Stitch pages (`CitizenMapPage`, `AlertsFeedPage`, `CitizenFloodSheetPage`, `HazardReportPage`, `SosEmergencyPage`, `CitizenRouteSelectPage`, plus the shared `LoginPage`) render **real** data end to end. Every `<Mock>`-wrapped value from the original Stitch export was either wired to a real field or removed outright when no real data source existed (e.g. fabricated road-cut distances, a fabricated hydro-gauge sensor card, a fabricated reroute ETA) rather than left as an invented number.

## Compatibility guarantees (kept)

- All pre-existing tests keep passing (**145 passed / 4 skipped** at completion, up from the pre-citizen baseline of 68/110).
- No existing endpoint contract changed. Schema changes are additive only (3 migrations, no `migrate reset`, no data loss).
- Risk/Cascade/Task engines untouched — reused via their existing exported functions (`assessAssetRisk`, `getZoneCascade`, `createIncident`).
- Single server, single database throughout.

## Known follow-ups (not blocking, flagged honestly)

1. **Shared Supabase migration pending** — developed and fully tested against a local Docker Postgres; the 3 additive migrations need to be run against the shared project once its connection string is confirmed working (`prisma migrate deploy`, no reset), plus an idempotent upsert of the citizen demo account (the normal seed wipes data and must not be run against the shared DB).
2. **Route/hazard-detail map backgrounds remain decorative** (not a live Leaflet/tile map) — every number/label on them is real; the map imagery itself is chrome, matching how the original Stitch mockups were structured. Wiring `react-leaflet` (already a dependency) to render real tiles/geometry is a reasonable next iteration.
3. **OSRM public demo server** is rate-limited/evaluation-only by its own usage policy — fine for this build, not for production traffic.
4. **Hazard-detail cascade context** reflects "this zone's current most-severe active hazard," which is 1:1 with the seed dataset (one hazard per zone) but could diverge if a zone ever has multiple concurrent active hazards — surfaced honestly via the response's `note` field, never hidden.
5. **Cross-citizen ownership isolation** is enforced by a `reporterId`/`requesterId` filter in every citizen-report/SOS query (tested for the 404-on-unknown-id case); a second seeded citizen account would let a future PR add an explicit cross-account isolation test.
