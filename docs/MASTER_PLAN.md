# ClimateShield — Master Project Plan

**Purpose of this document:** map the full hackathon problem statement (Phases 1-3) to what is *actually built and working* today vs. what remains, list every free/real API we use (and how), define the AI/ML approach honestly, define how Citizen / Government (+ subcategories) / Rescue coordinate end to end, and lay out an ordered, independently-shippable chunk plan for everything still needed. Nothing in this plan proposes fabricated data — every new data source below is either a real free API, a real historical/public dataset, or an explicitly-labeled deterministic computation.

---

## 0. Problem-statement -> current-state map

| PS requirement | Where it lives today | Status |
|---|---|---|
| Establish geographic/asset context | Zones + InfrastructureAsset (real Chennai OSM import + synthetic demo assets), Prisma schema | **Done** |
| Environmental data ingestion | Open-Meteo weather + air quality (live, no key) | **Done**; flood-specific signal missing (§2) |
| Assess ≥1 climate risk | Deterministic risk engine (`risk.service.ts`) — hazard × vulnerability × criticality × historical recurrence | **Done** |
| Identify vulnerable areas/assets | Cascade engine (`cascade.service.ts`) — dependency-graph traversal, zone risk ranking | **Done** |
| Alerts / recommended actions | Citizen alerts (computed), Gov `recommendedActions` in cascade/response-plan, Notification model | **Done** (delivery is DB-only — no email/SMS/push yet, see §7) |
| Multiple locations/assets, hazard-specific assessment | 4 zones + 19 assets seeded, real Chennai geography imported | **Done** |
| Historical incidents / vulnerability tracking | `HistoricalEvent`, `Hotspot` models, seeded | **Done** (hand-seeded, not derived — see §4.2) |
| Thresholds | Severity thresholds in `weather.service.ts` / `risk.ts` (rainfall/temp/wind bands) | **Done** |
| Preparedness plans | `createResponsePlan()` (proposal-only, human-confirmed) | **Done**, not wired to any frontend page yet |
| Response workflow, task assignment, escalation | Full transactional state machine: Incident → Task → ResponseUnit, `dispatchUnitToIncident`, `updateTaskStatus`, `verifyTask` | **Done on backend**; **frontend gap** — see §6 |
| Recovery tracking | Task/Incident terminal states (`COMPLETED`/`RESOLVED`/`CLOSED`), unit auto-released | **Done** |
| Reports / risk dashboards | `analytics.service.ts`, `GET /api/analytics/overview` | **Done on backend**; frontend page not wired |
| Roles & permissions | `ADMIN GOVERNMENT_OPERATOR DISPATCHER ANALYST FIELD_OPERATOR CITIZEN` — fully enforced server-side | **Done** — see §5 for exact mapping |
| Multiple locations/assets at scale | Real geography import pipeline (`import-chennai.ts`) reusable for any city with OSM coverage | **Done**, extensible |
| Deployment | Not yet deployed to a public URL | **Open** — see §8 Chunk J |
| Monetization | Not modeled | **Open, low priority** — doc-only recommendation, §8 Chunk J |
| Auth/authz, secure APIs, validation | JWT, bcrypt, Zod validation everywhere, RBAC, rate-limited login | **Done** |
| Reliability for delayed/unavailable data | Every value carries `dataQuality`; weather failures return `502 WEATHER_PROVIDER_*`, never fabricate; AI has a deterministic fallback | **Done** |
| False positive/negative, uncertainty | Risk engine returns `confidence`; AI confidence is clamped to never exceed engine confidence | **Done** |
| Failed alert delivery / escalation failure | Not modeled (no delivery channel exists yet) | **Open** — §7 |
| Duplicate events | `dispatchUnitToIncident` explicitly rejects duplicate dispatch (409) | **Done** |
| Message queues / async processing | None — everything is synchronous request/response | **Open** — §7 Chunk H |
| Documentation (methodology, architecture, security, failure modes) | `docs/API.md` (excellent, honest data-quality docs), `DECISIONS.md` (ADRs) | **Partial** — needs consolidated methodology/security/failure-mode docs, §7 Chunk I |

**Bottom line:** the *engine* (risk, cascade, simulator, task/dispatch state machine, AI explain layer) is real, deterministic, transactional, and already good enough to defend to a technical judge. The **citizen half of the product is fully wired end-to-end** (built in the previous session). The **weak link is the Government/Rescue frontend** — most of those pages are still hardcoded UI shells sitting on top of a backend that already supports everything they need.

---

## 1. Coordination model — how every role connects

```text
                              ┌─────────────────────────┐
                              │   ENVIRONMENTAL DATA     │
                              │ Open-Meteo (weather, AQI,│
                              │ flood/GloFAS) · OSM      │
                              └────────────┬─────────────┘
                                           │ live fetch
                                           ▼
                              ┌─────────────────────────┐
                              │  DETERMINISTIC ENGINES   │
                              │ risk.service · cascade   │
                              │ .service · simulator     │
                              └────────────┬─────────────┘
                                           │ MODELED risk/cascade
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
   ┌─────────────────┐         ┌─────────────────────┐       ┌──────────────────┐
   │     CITIZEN      │        │  GOVERNMENT (HQ)     │       │  GOVERNMENT       │
   │ live map, alerts,│───────▶│ ADMIN / OPERATOR /   │──────▶│  (FIELD/RESCUE)   │
   │ report hazard,   │ auto-  │ DISPATCHER / ANALYST │ Task  │  FIELD_OPERATOR   │
   │ SOS, safe route  │ Incident│ triage → dispatch    │ assign│  updates status,  │
   └────────┬─────────┘        └──────────┬───────────┘       │  Rescue-branded   │
            │                              │                   │  mobile pages     │
            │  Notification on             │  verifyTask()      └─────────┬─────────┘
            │  status change (§7 gap)      │  closes the loop             │
            ▼                              ▼                               ▼
   ┌─────────────────┐         ┌─────────────────────┐        task status updates,
   │ sees "Corridor   │◀───────│ Incident RESOLVED/   │◀───────field observations
   │ Cleared" alert   │        │ CLOSED, feeds         │
   └─────────────────┘         │ Analytics/Hotspots    │
                                 └─────────────────────┘
```

**Key fact:** "Rescue" is **not** a separate backend role. A Response Unit (`FIRE_RESCUE`, `EMS`, `PUMP_CREW`, etc.) is dispatched by a `DISPATCHER`/`GOVERNMENT_OPERATOR`; the person operating that unit's mobile device logs in as `FIELD_OPERATOR` and sees the Rescue-branded pages (`/rescue/*`). This is a **frontend persona of the same role**, not a schema change — avoids an unnecessary migration and matches how `task.service.ts` already gates `updateTaskStatus` to `FIELD_OPERATOR`.

---

## 2. Free/Real API catalog

| Provider | Endpoint | Key? | Status | Used for |
|---|---|---|---|---|
| Open-Meteo Weather | `api.open-meteo.com/v1/forecast` | No | ✅ Integrated | Live temp/rain/wind, government + citizen |
| Open-Meteo Air Quality | `air-quality-api.open-meteo.com/v1/air-quality` | No | ✅ Integrated | US AQI/PM2.5, citizen map |
| OpenStreetMap/Overpass | via `import-chennai.ts` | No | ✅ Integrated | Real Chennai zones/roads/infra |
| OSRM (public demo) | `router.project-osrm.org` | No | ✅ Integrated | Citizen safe-route alternatives |
| Nominatim (OSM) | `nominatim.openstreetmap.org/reverse` | No | ✅ Integrated | Reverse geocoding |
| Browser Geolocation | — | No | ✅ Integrated | Client GPS |
| **Open-Meteo Flood API** | `flood-api.open-meteo.com/v1/flood` | No (non-commercial) | 🆕 **Proposed — Chunk E** | **Real GloFAS river-discharge** (1984→7mo forecast, 5km res) as a genuine flood-specific signal, complementing rainfall-only modeling. Confirmed free, no key, global coverage. |
| Open-Meteo Geocoding | `geocoding-api.open-meteo.com` | No | 🆕 Proposed (optional) | Real place-name search for the citizen map search bar (currently a dead input) |
| Open-Meteo Historical/Archive Weather | `archive-api.open-meteo.com` | No | 🆕 Proposed (optional, Chunk G) | Real multi-year rainfall history per coordinate → genuine recurrence-score computation for Hotspots instead of hand-seeded scores |
| **ReliefWeb API** (UN OCHA) | `reliefweb.int/en/api` | No | 🆕 **Proposed — Chunk F** | Real, live humanitarian disaster reports — powers a "Global Disaster Intelligence" reference panel |
| NASA FIRMS | `firms.modaps.eosdis.nasa.gov` | Free self-register (MAP_KEY) | Documented, not integrated | Satellite fire/heat-anomaly detection — flagged as a credible future integration; not added now because it requires a signup key and isn't essential to the flood/heat MVP |
| data.gov.in / India-WRIS | data.gov.in | Free self-register | Documented, not integrated | Real Indian river-gauge levels — flagged in docs as the "next real step" for India-specific deployments; not integrated now due to key-signup friction within hackathon time |
| Google Gemini | `generativelanguage.googleapis.com` | Free tier, self-register | ✅ Integrated (explain layer) | Grounded narrative synthesis; proposed extension in §6 for vision-based photo triage |

Every one of these is genuinely free (no paid tier required to use what we use) and either already wired or has a concrete, scoped integration plan below — nothing is "planned" without a real, checked endpoint.

---

## 3. Real-world grounding: 2024 Assam / Northeast India floods

Researched (Wikipedia, cross-referenced with ReliefWeb/press citations already in that article) — genuine figures, not invented:

- **109 deaths** in Assam; **1,325 villages across 19 districts** inundated
- Worst-hit districts: **Karimganj, Darrang, Tamulpur**
- **400,000 people impacted**, 14,000 initially displaced (300,000+ displaced by the season's end)
- Rivers above danger level: **Brahmaputra, Kopili, Barak, Kushiyara** (13+ rivers total); **2,000+ island villages** at risk
- Kaziranga National Park flooded — **200+ wild animals died, including 10 rhinos**
- **Assam Rifles rescued 500** stranded civilians; Army rescued **70 students/teachers** in Changlang district, Arunachal Pradesh

**How to use this honestly (no fabricated Assam geometry):** we have real OSM-imported geography for Chennai only — we do **not** have real village-level polygons for Assam. Rather than inventing fake Assam zone boundaries (which would be exactly the kind of hallucination you told me to avoid), the plan is:

1. **"Historical Disaster Intelligence" panel** (Chunk F) — a read-only reference widget on the Government Analytics/Hotspots screen, powered by the **live ReliefWeb API** (real current disaster reports, filterable by country/hazard type) plus this cited 2024 Assam case study as static, clearly-sourced reference text (`dataQuality: REAL_HISTORICAL_REFERENCE`, with a citation link). This demonstrates real-world awareness and research to judges without pretending our Chennai demo data represents Assam.
2. **Optional stretch (Chunk J):** if there's time, run a second real OSM import (like `import-chennai.ts`) for a real Northeast India city/district (e.g., Guwahati) to get genuine second-city geography — this is a legitimate, scoped task, not assumed as part of the core plan.

---

## 4. AI/ML — honest scope

### 4.1 What's already built (confirmed by code audit)
`POST /api/incidents/:id/explain` — Gemini-grounded, **not free-form**:
- Every fact given to the model comes from the verified deterministic engine (`getIncidentCascade`) — root asset, risk score/confidence, cascade nodes, hazard readings.
- Model output is schema-validated; `confidence` is clamped to never exceed the engine's own confidence; recommended actions are restricted to a whitelisted catalog.
- **Any failure** (no API key, timeout, bad JSON, validation failure) falls back to a fully deterministic template — AI is never a single point of failure.

This already satisfies "AI integration" credibly. What's proposed below **adds** genuine, scoped ML/AI value rather than overclaiming a custom-trained deep model we don't have time to build responsibly.

### 4.2 Proposed additions (Chunk G)
1. **Gemini Vision citizen-photo triage** — when a citizen submits report evidence, send the photo to Gemini's vision endpoint (same API already integrated) asking only for a structured, whitelisted classification (`category confidence`, `visible water depth estimate: none|ankle|knee|waist|submerged`, `caption`) — stored as an **additional, clearly non-authoritative signal** on the `CitizenReport` (mirrors how `reportedSeverity` is already labeled non-authoritative). This is genuinely novel, judge-visible, and buildable in one chunk since the Gemini plumbing already exists.
2. **Statistical risk-trend forecasting** — plain deterministic time-series math (linear trend / exponential smoothing) over stored `WeatherSnapshot`/`TelemetryReading` history to forecast next-N-hour risk trend per zone. Real math, `dataQuality: FORECAST`, no new dependency.
3. **Real hotspot derivation via clustering** — a simple k-means/DBSCAN-style clustering (small, dependency-free TS implementation) over `HistoricalEvent` lat/lng + severity to **derive** hotspots from data instead of hand-authoring them. This is genuine unsupervised ML, not a buzzword.

**Explicitly not doing:** claiming a custom-trained deep-learning model (no time to build, validate, and honestly document one within a hackathon window — would risk becoming exactly the kind of unverifiable claim you told me to avoid).

---

## 5. Roles & permissions — exact mapping

| Role | Frontend persona | Backend permissions (already enforced) |
|---|---|---|
| `ADMIN` | Government HQ (full) | Everything, incl. audit/departments |
| `GOVERNMENT_OPERATOR` | Government HQ (EOC Director) | Overview, zone cascade, response center, simulator, dispatch, task verify |
| `DISPATCHER` | Government HQ (operational) | Response center, dispatch, task assignment |
| `ANALYST` | Government HQ (read-only) | Analytics, hotspots, history — **no** dispatch/write (already excluded from `GOVERNMENT_ROLES`) |
| `FIELD_OPERATOR` | **Government Mobile** *or* **Rescue Team** (same role, different frontend routes/branding) | View assigned tasks, update task status (`ASSIGNED→ACKNOWLEDGED→IN_PROGRESS→COMPLETED`) |
| `CITIZEN` | Citizen app | Own reports/SOS, public-safety reads only — fully built |

---

## 6. Closing the loop — one real gap found

Today: Citizen report/SOS → auto-`Incident` → Government resolves it → **nothing tells the citizen it was resolved.** The link exists (`CitizenReport.incidentId`) but nothing reads it back. **Chunk D** adds: when an Incident linked to a `CitizenReport`/`SosEvent` changes status, create a `Notification`-equivalent for that citizen (reusing the existing `Notification` model against the citizen's own `userId`) and surface it in `GET /api/citizen/alerts` or a small new `GET /api/citizen/reports/:id` status poll (already returns `incident.status` — just needs the frontend to show it / poll it, which is a small, real addition).

---

## 7. Phase 3 hardening — genuine gaps, scoped honestly

- **Message queue / async processing** (explicit PS ask, currently absent): recommend **BullMQ + Redis** (free, self-hosted via a Docker container, matches the existing local-Postgres-in-Docker pattern already used for dev) for: hazard ingestion → risk recompute → notification fan-out → report generation. Chunk H.
- **Alert delivery reliability**: currently DB-only `Notification` rows, no actual delivery channel or retry/escalation. Propose an outbox pattern processed by the same queue; real delivery (email) would need a free-tier transactional provider (e.g., Resend/Brevo free tier, requires signup) — will document as an explicit limitation if not wired due to key friction, never fake a "sent" status.
- **Rate limiting**: only on login today; extend to citizen SOS/report endpoints (abuse prevention).
- **Monitoring**: structured JSON logs exist; no metrics. Add a lightweight `/metrics` endpoint (Prometheus text format, no new infra) for request duration/error-rate — genuinely useful, zero paid dependency.
- **Documentation deliverables** the PS explicitly asks for: `docs/RISK_METHODOLOGY.md`, `docs/SECURITY.md`, `docs/FAILURE_MODES.md`, and a deployment/scalability section in `ARCHITECTURE.md`. Chunk I.

---

## 8. Ordered chunk plan

| # | Chunk | Why this order |
|---|---|---|
| A | Wire `GovResponseCenterPage` + `GovSimulatorPage` to the real, already-working backend endpoints | Biggest "fake→real" jump for least effort — backend is 100% ready |
| B | Wire all 6 Rescue pages to real task/unit endpoints (`FIELD_OPERATOR`) | Completes the Citizen→Gov→**Rescue** loop end to end — currently the single biggest gap |
| C | Wire remaining Gov pages (Critical Asset Monitor, Mobile Map/Triage/Tasks) | Finishes Government side |
| D | Citizen notification on their own report/SOS resolution | Small, closes the full loop both directions |
| E | Open-Meteo Flood/GloFAS integration | Real flood-specific signal, cheap to add |
| F | ReliefWeb "Disaster Intelligence" panel + cited 2024 Assam case study | Real-world grounding, judge-visible research depth |
| G | AI/ML additions: Gemini vision photo triage, statistical forecasting, clustering-derived hotspots | High "wow factor," builds on existing Gemini plumbing |
| H | Message queue (BullMQ+Redis) for hazard/risk/notification pipeline | Phase 3 requirement |
| I | `/metrics` endpoint, extended rate limiting, notification outbox | Phase 3 hardening |
| J | Documentation set (methodology/security/failure-modes/deployment) + optional monetization doc + optional second-city real import | Wraps every PS Phase 3 documentation ask |

Each chunk is independently testable and committable, following the same pattern as the citizen-workflow chunks (typecheck → tests → build → commit).
