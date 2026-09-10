# ClimateShield — REST API Contracts

Base URL: `http://<host>:<PORT>/api` • JSON only • All timestamps ISO-8601 UTC.

## Conventions

- **Auth**: `Authorization: Bearer <jwt>` — required on every endpoint except `POST /api/auth/login` and `GET /api/health`.
- **Roles**: `ADMIN`, `GOVERNMENT_OPERATOR`, `DISPATCHER`, `FIELD_OPERATOR`, `ANALYST`. Roles are resolved server-side from the verified JWT — never trusted from the client. `GOV = GOVERNMENT_OPERATOR | DISPATCHER | ADMIN`.
- **Success envelope**: `{ "success": true, "data": ... }`.
- **Lists**: `{ "items": [...], "pagination": { "page", "limit", "total", "totalPages", "hasMore" } }`.
- **Error envelope**:

```json
{ "success": false, "error": { "code": "UNIT_NOT_AVAILABLE", "message": "Response unit ... is currently ASSIGNED", "details": {} } }
```

- **HTTP codes**: 400 validation · 401 unauthenticated · 403 forbidden · 404 not found · 409 conflict · 422 business-rule violation · 429 rate-limited · 500 internal (no stack traces in production).
- **Id resolution**: documented `:id` params accept either the database id or the human code (`INC-204`, `TASK-005`, `DRAIN-07`, `EB`, `PW-DRAIN-A1`, `PW`).
- **Demo data**: payloads containing synthetic demo values are tagged `dataQuality: "SYNTHETIC_DEMO"`.
- **Data quality semantics** (every block labels its own quality — never mix provenance):

| Value | Meaning |
|---|---|
| `LIVE_OBSERVED` | Current measurement fetched live from an external provider at request time (e.g. Open-Meteo temperature, rainfall, wind). |
| `FORECAST` | Provider forecast hour(s), not a current observation. |
| `REAL_GEOGRAPHIC` | Imported real-world geography from OpenStreetMap/Overpass (GCC zone boundaries, OSM infrastructure geometry). Existence is real; operational metadata (criticality, status) may still be application defaults. |
| `MODELED` | Deterministic output of ClimateShield engines (risk scores, cascade, severity classification from live inputs). Never presented as a sensor reading. |
| `SYNTHETIC_DEMO` | Seeded fictional demo data (Bayview Metro operational scenario). |
| `MIXED` | GeoJSON collection containing more than one quality (e.g. real Chennai roads + synthetic demo assets). Inspect per-feature `properties.dataQuality`. |
| `UNKNOWN` | No legitimate public feed integrated (e.g. official IMD/CWC/state-DMA alerts). Empty arrays — never fabricated. |

### Common error codes

`VALIDATION_ERROR` · `UNAUTHENTICATED` · `INVALID_TOKEN` · `INVALID_CREDENTIALS` · `ACCOUNT_DISABLED` · `FORBIDDEN` · `ROUTE_NOT_FOUND` · `INCIDENT_NOT_FOUND` · `TASK_NOT_FOUND` · `RESPONSE_UNIT_NOT_FOUND` · `INFRASTRUCTURE_ASSET_NOT_FOUND` · `ZONE_NOT_FOUND` · `DEPARTMENT_NOT_FOUND` · `SIMULATION_NOT_FOUND` · `HAZARD_NOT_FOUND` · `HOTSPOT_NOT_FOUND` · `USER_NOT_FOUND` · `INCIDENT_NOT_ACTIVE` · `UNIT_NOT_AVAILABLE` · `DUPLICATE_DISPATCH` · `NO_UNITS_AVAILABLE` · `TASK_ALREADY_ASSIGNED` · `TASK_NOT_COMPLETED` · `TASK_ALREADY_VERIFIED` · `TASK_NOT_ACTIVE` · `INVALID_STATUS_TRANSITION` · `RATE_LIMITED` · `UNIQUE_CONSTRAINT` · `INTERNAL_ERROR`

---

## Authentication

### POST /api/auth/login — public, rate-limited (20 / 15 min)

Body: `{ "email": "government@climateshield.demo", "password": "DemoGov@2024" }`

```json
{
  "success": true,
  "data": {
    "user": {
      "id": "user_gov", "name": "Dana Whitfield", "email": "government@climateshield.demo",
      "role": "GOVERNMENT_OPERATOR", "departmentId": "dept_em", "departmentName": "Emergency Management",
      "phone": "+1-555-0201", "isActive": true, "createdAt": "..."
    },
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "tokenType": "Bearer",
    "expiresIn": "12h"
  }
}
```

Errors: `400 VALIDATION_ERROR` · `401 INVALID_CREDENTIALS` · `403 ACCOUNT_DISABLED` · `429 RATE_LIMITED`. `passwordHash` is never returned.

### GET /api/auth/me — authenticated (any role)

Returns `{ "user": SafeUser }` for the token's account (re-validated against the database, so disabled accounts lose access immediately).

---

## Health

### GET /api/health — public

Performs a real database probe:

```json
{ "status": "ok", "database": "connected", "timestamp": "2026-09-10T10:49:25.991Z" }
```

`503` + `"database": "disconnected"` when PostgreSQL is unreachable.

---

## Overview (Government dashboard)

### GET /api/government/overview — authenticated

Every metric is computed from PostgreSQL (never hardcoded). Resilience formula:
`100 × (0.30×(1−hazardLoad) + 0.30×(1−incidentLoad) + 0.25×(1−infrastructureLoad) + 0.15×unitReadiness)`.

```json
{
  "success": true,
  "data": {
    "dataQuality": "SYNTHETIC_DEMO",
    "resilienceIndex": 45,
    "resilienceLevel": "MODERATE_CAUTION",
    "resilienceFormula": "0.30*(1-hazardLoad) + ...",
    "resilienceTrend": { "direction": "DECLINING", "delta": 3, "description": "6 new incidents in the last 24h vs 3 in the prior 24h." },
    "activeThreats": 4,
    "monitoredZones": 4,
    "criticalInfrastructure": { "total": 4, "compromised": 0, "degraded": 2 },
    "mobility": { "index": 60, "status": "DEGRADED", "blockedRoads": 2 },
    "grid": { "status": "STRAINED", "loadPercent": 87, "note": "0 of 4 ... compromised, 1 degraded (synthetic demo)." },
    "precipitation": { "value": 66, "unit": "mm/hr", "source": "active hazard monitor / sensor telemetry (synthetic demo)" },
    "heat": { "value": 41.2, "unit": "°C", "source": "..." },
    "activeIncidents": 8,
    "criticalIncidents": 2,
    "resourceReadiness": { "percent": 73, "availableUnits": 8, "totalUnits": 12 },
    "recentCriticalIncidents": [
    {
      "id": "inc_204", "incidentCode": "INC-204", "title": "Flash Inundation - East Basin Arterial Network",
      "severity": "CRITICAL", "status": "NEW", "type": "FLOODING", "zoneName": "East Basin",
      "assetName": "East Basin Drain D07", "reportedAt": "...", "slaDeadline": "...", "assignedUnits": []
    }],
    "activeHazards": [ { "id": "hz_ff_eb", "type": "FLASH_FLOOD", "severity": "CRITICAL", "zoneName": "East Basin", "rainfallRate": 65, "waterDepth": 1.4, "temperature": null, "windSpeed": null, "startedAt": "..." } ]
  }
}
```

---

## Incidents

### GET /api/incidents — authenticated

Query: `page` `limit` (≤200) `severity` `status` `type` `zoneId` `hazardId` `search` (title contains).

Returns paginated incident summaries: code, title, description, type, severity, status, zone, hazard, primaryAsset, reportedAt/acknowledgedAt/resolvedAt, slaDeadline + `slaMinutesRemaining` (negative = overdue), `taskCount`, `cascadeEventCount`, `assignedUnits[]` (unit + task + statuses), createdByName.

### GET /api/incidents/:id — authenticated

Incident detail for the detail drawer **plus everything dispatch needs**:

```json
{
  "success": true,
  "data": {
    "incident": { "incidentCode": "INC-204", "severity": "CRITICAL", "status": "NEW", "zone": { "name": "East Basin", "riskLevel": "CRITICAL" }, "primaryAsset": { "assetCode": "DRAIN-07", "operationalStatus": "COMPROMISED" }, "slaMinutesRemaining": 79, "assignedUnits": [] },
    "cascade": {
      "rootAsset": { "assetCode": "DRAIN-07", "name": "East Basin Drain D07", "type": "DRAIN" },
      "hazard": { "type": "FLASH_FLOOD", "severity": "CRITICAL", "rainfallRate": 65 },
      "baseRisk": { "score": 81, "level": "CRITICAL", "confidence": 0.95, "factors": [ { "name": "Rainfall & flood intensity", "contribution": 26 } ] },
      "nodes": [
        { "assetCode": "DRAIN-07", "depth": 0, "impactType": "OVERWHELMED", "impactScore": 81 },
        { "assetCode": "RD-24", "depth": 1, "impactType": "INUNDATED", "impactScore": 66 },
        { "assetCode": "GATE-B", "depth": 2, "impactType": "AMBULANCE_DELAYED", "impactScore": 51 },
        { "assetCode": "HOSP-01", "depth": 3, "impactType": "ACCESS_BLOCKED", "impactScore": 42 }
      ]
    },
    "availableUnits": [ { "id": "unit_pump_1", "callsign": "PW-DRAIN-A1", "type": "PUMP_CREW", "status": "AVAILABLE", "departmentName": "Public Works", "etaMinutes": 12 } ]
  }
}
```

Audited as `INCIDENT_VIEWED`. Errors: `404 INCIDENT_NOT_FOUND`.

### POST /api/incidents — GOV

Body: `{ "title", "type", "severity", "zoneId", "description?", "hazardId?", "primaryAssetId?", "reportedAt?", "slaDeadline?" }`.

Backend sets `incidentCode` (next `INC-###`), status `NEW`, and the SLA deadline from severity policy (CRITICAL 2h / HIGH 4h / MODERATE 8h / LOW 24h) when not provided. If a primary asset is given, the cascade projection is computed and persisted. Audited `INCIDENT_CREATED`.

Errors: `404 ZONE_NOT_FOUND / HAZARD_NOT_FOUND / INFRASTRUCTURE_ASSET_NOT_FOUND` · `422 HAZARD_ZONE_MISMATCH / ASSET_ZONE_MISMATCH`.

### PATCH /api/incidents/:id — GOV

Body (all optional): `{ "title?", "description?", "severity?", "hazardId?" (nullable), "primaryAssetId?" (nullable) }`. Audited `INCIDENT_UPDATED`.

### PATCH /api/incidents/:id/status — GOV

Body: `{ "status", "note?" }`. Valid transitions: `NEW→ACKNOWLEDGED|IN_PROGRESS`, `ACKNOWLEDGED→IN_PROGRESS|RESOLVED`, `IN_PROGRESS→RESOLVED`, `RESOLVED→CLOSED`. Timestamps (`acknowledgedAt`, `resolvedAt`) are set automatically. Audited `INCIDENT_STATUS_CHANGED`.

Errors: `422 INVALID_STATUS_TRANSITION` (with `details.allowed`).

### GET /api/incidents/:id/cascade — authenticated

Computed cascade for the incident (root = primary asset, else highest-risk asset in zone): `{ incident, hazard, rootAsset, baseRisk, nodes[] }`.

### POST /api/incidents/:incidentId/dispatch — GOV  ⭐ core workflow

Body: `{ "unitId": "unit_pump_1" }` — **fully transactional**:

1. incident exists & is active (`NEW/ACKNOWLEDGED/IN_PROGRESS`) → else `422 INCIDENT_NOT_ACTIVE`
2. unit exists → else `404 RESPONSE_UNIT_NOT_FOUND`
3. no active task for this incident+unit → else `409 DUPLICATE_DISPATCH`
4. unit is `AVAILABLE` → else `409 UNIT_NOT_AVAILABLE`
5. creates the task (`TASK-###`, priority from incident severity, SLA inherited/computed)
6. unit → `ASSIGNED`; `TaskStatusHistory` (→ASSIGNED); first dispatch auto-acknowledges a `NEW` incident
7. `AuditLog`: `TASK_CREATED` + `UNIT_ASSIGNED`

```json
{
  "success": true,
  "data": {
    "task": { "id": "task_005", "taskCode": "TASK-005", "incidentCode": "INC-204", "unitId": "unit_pump_1", "unitCallsign": "PW-DRAIN-A1", "status": "ASSIGNED", "priority": "CRITICAL", "slaDeadline": "..." },
    "incident": { "incidentCode": "INC-204", "status": "ACKNOWLEDGED" },
    "unit": { "callsign": "PW-DRAIN-A1", "status": "ASSIGNED" }
  }
}
```

If any step fails the whole transaction rolls back — a task can never exist while its unit stayed AVAILABLE.

---

## Response Center

### GET /api/response-center — authenticated

The full dispatch board, computed live:

```json
{
  "success": true,
  "data": {
    "summary": {
      "activeIncidents": 8, "critical": 2, "high": 2, "moderate": 3,
      "unassignedIncidents": 5, "assignedUnits": 3, "readinessPercent": 73,
      "avgResponseMinutes": 7, "slaCompliancePercent": 75,
      "targetResolutionHours": { "CRITICAL": 2, "HIGH": 4, "MODERATE": 8, "LOW": 24 }
    },
    "severityGroups": { "CRITICAL": [IncidentCard], "HIGH": [IncidentCard], "MODERATE": [IncidentCard], "LOW": [IncidentCard] },
    "activeIncidents": [IncidentCard],
    "unassignedIncidents": [IncidentCard],
    "availableUnits": [UnitCard],
    "telemetry": {
      "rainfallMmPerHour": 66, "maxWaterDepthM": 1.42, "maxTemperatureC": 41.2,
      "maxPumpRuntimeHours": 18.4, "maxPowerLoadPercent": 91, "updatedAt": "..."
    },
    "hotspots": [HotspotCard]
  }
}
```

`IncidentCard` = `{ id, incidentCode, title, description, severity, status, type, zoneId, zoneName, assetName, reportedAt, slaDeadline, slaMinutesRemaining, assignedUnits[], taskCodes[] }`.

## Response Plan (Zone Detail → "Create Response Plan")

### POST /api/zones/:zoneId/response-plan — GOV

No body required. Deterministically derives a plan from active hazards, affected assets, cascade events, AVAILABLE units, severity and risk score. **Never executes anything** — the Government operator must confirm/dispatch each action.

```json
{
  "success": true,
  "data": {
    "status": "PROPOSED",
    "note": "DEMO/SIMULATED planning data. Plan status: PROPOSED only - nothing has been dispatched...",
    "zoneName": "East Basin", "riskScore": 84, "riskLevel": "CRITICAL", "severity": "CRITICAL",
    "hazardType": "FLASH_FLOOD", "priority": "CRITICAL", "etaMinutes": 12,
    "affectedAssets": [ { "assetCode": "RD-24", "name": "East Basin Arterial Road R24", "impactType": "INUNDATED" } ],
    "recommendedActions": [ { "action": "Establish traffic reroute around ...", "rationale": "Derived from CRITICAL zone risk ...", "priority": "CRITICAL", "suggestedUnitTypes": ["PUMP_CREW","BARRIER_CREW"] } ],
    "recommendedUnits": [ { "unitId": "unit_pump_1", "callsign": "PW-DRAIN-A1", "type": "PUMP_CREW", "etaMinutes": 12 } ],
    "cascadeSummary": ["East Basin Drain D07 -> OVERWHELMED (depth 0 ...)"]
  }
}
```

Audited `RESPONSE_PLAN_CREATED`. Errors: `404 ZONE_NOT_FOUND`.

---

## Tasks

### GET /api/tasks — authenticated

Query: `page` `limit` `status` `priority` `incidentId` `assignedUnitId` `assetId` `assignedDepartmentId`.

Task DTO: `{ id, taskCode, title, description, status, priority, incident{incidentCode,severity,status}, asset, assignedUnit{callsign,status,departmentName}, assignedDepartment, createdByName, slaDeadline, slaMinutesRemaining, createdAt, acknowledgedAt, startedAt, completedAt, verifiedAt }`.

### GET /api/tasks/:id — authenticated

Task DTO **plus `history[]`** (every `TaskStatusHistory` entry with actor name/role).

### POST /api/tasks — GOV

Manual task creation (maintenance, pre-incident tasking). Body:

```json
{ "title": "...", "incidentId?": "INC-201", "assetId?": "DRAIN-07", "assignedUnitId?": "PW-DRAIN-A1",
  "assignedDepartmentId?": "PW", "priority?": "HIGH", "description?": "...", "slaDeadline?": "..." }
```

Rules: incident must be active (`422 INCIDENT_NOT_ACTIVE`); unit must be `AVAILABLE` (`409 UNIT_NOT_AVAILABLE`); assigning a unit flips it to `ASSIGNED`, writes history + `TASK_CREATED`/`UNIT_ASSIGNED` audits (transactional).

### PATCH /api/tasks/:id/status — FIELD_OPERATOR, DISPATCHER, GOVERNMENT_OPERATOR, ADMIN

Body: `{ "status", "note? }`}. Valid transitions (backend-enforced, audited, history-recorded):

```
ASSIGNED → ACKNOWLEDGED | CANCELLED
ACKNOWLEDGED → IN_PROGRESS | CANCELLED
IN_PROGRESS → COMPLETED | CANCELLED
COMPLETED → CANCELLED
any terminal → (nothing)
```

Timestamps: `acknowledgedAt` / `startedAt` / `completedAt` set automatically. **Completing or cancelling releases the assigned unit back to `AVAILABLE`** (when it has no other active tasks). Audited as `TASK_ACKNOWLEDGED` / `TASK_STARTED` / `TASK_COMPLETED` / `TASK_CANCELLED`.

Errors: `422 INVALID_STATUS_TRANSITION` (with `details.allowed`) · `404 TASK_NOT_FOUND`.

### POST /api/tasks/:id/assign — GOV

Body: `{ "unitId" }` — attaches a unit to an **unassigned** active task. `409 TASK_ALREADY_ASSIGNED` / `409 UNIT_NOT_AVAILABLE` / `422 TASK_NOT_ACTIVE`.

### POST /api/tasks/:id/verify — GOV

Body: `{ "note? }`}. Only `COMPLETED` tasks (`422 TASK_NOT_COMPLETED`), only once (`409 TASK_ALREADY_VERIFIED`). Sets `verifiedAt`, audited `TASK_VERIFIED`.

### GET /api/tasks/:id/history — authenticated

`{ task: { id, taskCode, status }, history: [ { fromStatus, toStatus, changedBy{ name, role }, note, createdAt } ] }`

---

## Response Units

### GET /api/units — authenticated

Query: `page` `limit` `status` `type` `departmentId` `search` (name/callsign). Unit DTO includes `departmentName`, `teamSize`, `capacity`, `specialization`, `etaMinutes`, coordinates and `activeTasks[]`.

### GET /api/units/:id — authenticated

Unit detail + last 20 tasks (with incident context).

### PATCH /api/units/:id/status — GOVERNMENT_OPERATOR, DISPATCHER, ADMIN, FIELD_OPERATOR

Body: `{ "status", "note? }`}`. Unit state machine (backend-enforced, audited `UNIT_STATUS_CHANGED`):

```
AVAILABLE → ASSIGNED | EN_ROUTE | ON_SCENE | BUSY | OFFLINE
ASSIGNED  → EN_ROUTE | ON_SCENE | AVAILABLE | BUSY | OFFLINE
EN_ROUTE  → ON_SCENE | AVAILABLE | BUSY | OFFLINE
ON_SCENE  → AVAILABLE | ASSIGNED | BUSY | OFFLINE
BUSY      → AVAILABLE | OFFLINE
OFFLINE   → AVAILABLE
```

Errors: `422 INVALID_STATUS_TRANSITION`.

---

## Infrastructure

### GET /api/infrastructure — authenticated

Query: `page` `limit` `facilityType` `zoneId` `vulnerability` (min 0-100) `status` `criticality` `search` (name/assetCode).

Each item is a fully enriched facility card (fields the UI renders — access status, failover power, bed occupancy, thermal load, water proximity, backup power, pump runtime, evacuation status):

```json
{
  "id": "asset_hosp_01", "assetCode": "HOSP-01", "name": "St. Jude Regional Medical Center",
  "type": "HOSPITAL", "zone": { "name": "Midtown", "code": "MT" }, "criticality": "CRITICAL",
  "vulnerability": 78, "operationalStatus": "OPERATIONAL",
  "failoverPower": true, "backupPower": true, "waterProximityM": 850,
  "evacuationStatus": "OPEN", "beds": 340, "bedOccupancyPercent": 82, "capacity": null, "occupancyPercent": null,
  "telemetry": { "occupancy": { "value": 82, "unit": "%", "timestamp": "..." }, "thermal_load": { "value": 0.31, "unit": "index" } },
  "telemetryDelayMinutes": 20,
  "risk": { "score": 62, "level": "HIGH" },
  "activeIncidents": 0, "activeTasks": 1
}
```

### GET /api/infrastructure/:id — authenticated

Detail: asset + zone + last 20 telemetry readings + last 5 risk snapshots + `risk` (fresh computation) + `hazard` (zone's most severe active hazard) + `cascade[]` (downstream projection) + `upstream[]` / `downstream[]` dependency edges + active tasks (with units) + active incidents.

### GET /api/infrastructure/:id/telemetry — authenticated

Query: `metric?` (e.g. `water_depth`), `limit` (default 50). Returns `{ asset, readings[] (desc), latest: { [metric]: {value, unit, timestamp} } }`. Metrics include `rainfall`, `water_depth`, `temperature`, `thermal_load`, `pump_runtime`, `power_load`, `occupancy`, `water_reserve`, `wind_speed`.

### GET /api/infrastructure/:id/risk — authenticated

Fresh deterministic assessment (and persists a snapshot):

```json
{ "asset": { "assetCode": "DRAIN-07" }, "hazard": { "type": "FLASH_FLOOD", "severity": "CRITICAL", "rainfallRate": 65 },
  "assessment": {
    "score": 81, "level": "CRITICAL", "confidence": 0.95,
    "factors": [
      { "name": "Rainfall & flood intensity", "contribution": 26 },
      { "name": "Asset vulnerability", "contribution": 23 },
      { "name": "Asset criticality", "contribution": 21 },
      { "name": "Historical recurrence", "contribution": 11 } ],
    "explanation": "CRITICAL FLASH_FLOOD exposure on a HIGH-criticality asset (vulnerability 88/100, 3 prior synthetic events) produces a deterministic risk score of 81/100 (CRITICAL).",
    "components": { "hazard": 1, "vulnerability": 0.88, "criticality": 0.8, "historical": 1.15 } },
  "snapshotId": "..." }
```

### GET /api/infrastructure/:id/dependencies — authenticated

`{ asset, upstream: [ { dependencyType, strength, asset } ], downstream: [ ... ], cascadePreview: [CascadeNode] }` — the stored `DependencyEdge` graph in both directions.

### GET /api/infrastructure/:id/logs — authenticated

Facility operational history: audit logs for the asset, its tasks (with status history), incidents, telemetry and risk snapshots.

### POST /api/infrastructure/:id/assign-team — GOV  ("Assign Rapid Team")

Body: `{ "unitId?" (id or callsign), "note? }`}`. Without `unitId` the backend auto-selects the best `AVAILABLE` unit by asset-type mapping (e.g. `DRAIN → PUMP_CREW/PUBLIC_WORKS`, `SUBSTATION → UTILITY`, `HOSPITAL → EMS`). Transactional: task (`Rapid response: <asset>`) + unit assignment + history + audits (`ASSET_TEAM_ASSIGNED`, `TASK_CREATED`). `409 NO_UNITS_AVAILABLE` when nothing matches.

### POST /api/infrastructure/:id/maintenance — GOV  ("Assign Maintenance")

Body: `{ "description?", "priority? }`}`. Creates a `Maintenance: <asset>` task for the PUBLIC_WORKS department (no unit — dispatched later), audited `ASSET_MAINTENANCE_REQUESTED` + `TASK_CREATED`.

### POST /api/infrastructure/:id/reroute — GOV  ("Reroute Traffic")

Body: `{ "reason? }`}`. Issues a deterministic, audited (`TRAFFIC_REROUTED`) advisory with alternative routes (operational ROAD/BRIDGE assets in the same zone):

```json
{ "asset": { "assetCode": "BRG-02" }, "alternatives": [ { "assetCode": "RD-18", "name": "Harbor Service Road" } ],
  "advisory": "Traffic reroute advisory issued for Metro Causeway Bridge (reason: Deck vibration). Route via Harbor Service Road. (DEMO/SIMULATED advisory - no external traffic systems connected.)",
  "issuedAt": "..." }
```

---

## Zones

Real **Greater Chennai Corporation** zones (`REAL_GEOGRAPHIC`, codes `GCC-Z01`…`GCC-Z14`) coexist with the seeded **Bayview Metro** demo zones (`SYNTHETIC_DEMO`, codes `EB`, `PW`, …). Each zone DTO includes `source`, `sourceId`, and `dataQuality`. Point-in-polygon resolution for live coordinates prefers `REAL_GEOGRAPHIC` boundaries; unmatched coordinates return `zone: null`.

### GET /api/zones — authenticated

Query: `page` `limit` `riskLevel`. Zone summaries with asset/hotspot/historical-event counts, active hazards and active incident counts. Response items include `dataQuality`, `source`, `code`, `name`, centroid coordinates.

### GET /api/zones/:id — authenticated

Zone detail: zone + assets (ordered by criticality) + active hazards + active incidents + hotspots. Accepts zone id or code (`GCC-Z13`, `EB`).

### GET /api/zones/:zoneId/cascade — authenticated  (Zone Detail screen)

```json
{
  "success": true,
  "data": {
    "zone": { "code": "EB", "name": "East Basin", "riskLevel": "CRITICAL", "population": 14200, "latitude": 13.062, "longitude": 80.275 },
    "hazard": { "type": "FLASH_FLOOD", "severity": "CRITICAL", "rainfallRate": 65, "startedAt": "..." },
    "riskScore": 84, "riskLevel": "CRITICAL",
    "riskFactors": [ { "name": "Rainfall & flood intensity", "contribution": 27 } ],
    "contributingFactors": ["Rainfall & flood intensity: +27 points", "Asset vulnerability: +24 points", "..."],
    "impact": { "blockedRoads": 1, "affectedFacilities": 2, "residents": 7810 },
    "cascade": [ { "asset": "East Basin Drain D07", "assetCode": "DRAIN-07", "impact": "OVERWHELMED", "depth": 0, "impactScore": 84 } ],
    "impactedInfrastructure": [ { "assetCode": "RD-24", "type": "ROAD", "operationalStatus": "DEGRADED", "impactType": "INUNDATED", "impactScore": 67 } ],
    "affectedRoads": ["East Basin Arterial Road R24"],
    "affectedFacilities": ["St. Jude Ambulance Gate B", "St. Jude Regional Medical Center"],
    "recommendedResponseActions": ["Establish traffic reroute around East Basin Arterial Road R24 and deploy a barrier crew.", "..."]
  }
}
```

`residents` = zone population × severity exposure factor (CRITICAL 0.55 / HIGH 0.35 / MODERATE 0.18 / LOW 0.08). Errors: `404 ZONE_NOT_FOUND`.

---

## Hazards

### GET /api/hazards — authenticated

Query: `page` `limit` `type` `severity` `status` `zoneId` `activeOnly=true|false`. Hazard DTO with zone, measurements, duration, source (`SIMULATOR`/`WEATHER_API`/`OPERATOR`/`SENSOR`/`HISTORICAL`) and `incidentCount`.

### GET /api/hazards/:id — authenticated

Hazard + zone + linked incidents + recent risk scores.

### POST /api/hazards — GOV

Body: `{ "type", "severity", "zoneId", "rainfallRate?", "waterDepth?", "flowVelocity?", "temperature?", "windSpeed?", "durationMinutes?", "source?=OPERATOR", "startedAt? }`}. Audited `HAZARD_CREATED`.

---

## Live Map (GeoJSON for MapLibre)

All map endpoints return GeoJSON `FeatureCollection`s ready for MapLibre. Each **feature** carries its own `properties.dataQuality` and `properties.source`. The **collection-level** `dataQuality` is derived: single-quality collections pass through (`REAL_GEOGRAPHIC`, `SYNTHETIC_DEMO`, …); mixed datasets are labelled `MIXED` — the frontend must not assume one quality for the whole layer.

Imported Chennai infrastructure (`REAL_GEOGRAPHIC`, `source: "OpenStreetMap"`) includes full `LineString` geometry on roads/bridges/drains when available; point assets use centroid `Point` geometry. Seeded demo assets remain `SYNTHETIC_DEMO`.

| Endpoint | Query | Feature properties |
|---|---|---|
| `GET /api/map/assets` | `zoneId` `assetType` `status` `criticality` | id, assetCode, name, type, criticality, operationalStatus, vulnerability, zoneName, **source, dataQuality**; geometry = Point or LineString |
| `GET /api/map/hazards` | `zoneId` `severity` `hazardType` `status` | id, type, severity, status, zoneName, rainfallRate, waterDepth, temperature, windSpeed, startedAt, source, **dataQuality** |
| `GET /api/map/incidents` | `zoneId` `severity` `status` (default: active) | id, incidentCode, title, type, severity, status, zoneName, assetName, slaDeadline |
| `GET /api/map/units` | `status` `type` `departmentId` (default: non-OFFLINE) | id, callsign, type, status, departmentName, etaMinutes |
| `GET /api/map/overlays` | — | object of FeatureCollections (below) |

`/api/map/overlays` keys (GIS layer toggles): `floodZones` (zones with active flood hazards or HIGH/CRITICAL risk), `heatZones` (active EXTREME_HEAT), `roadClosures` (non-operational roads/bridges + active ROAD_BLOCKAGE/FLOODING incident assets, with `reason`), `criticalInfrastructure` (CRITICAL/HIGH assets), `drainageTelemetry` (DRAIN/PUMPING_STATION with latest `waterDepthM`, `pumpRuntimeHours`, `rainfallMmPerHour`), `evacuationCorridors` (shelters + cooling centers with capacity), `incidents`, `units`. Each sub-collection is labelled at collection level; features retain per-feature quality where applicable.

**Frontend integration note:** the Live Map should call `GET /api/location/overview?latitude=&longitude=` when the user selects a map point — do **not** recompute risk, cascade, haversine distance, or severity client-side. Use this map endpoints suite for layer rendering only.

---

## Simulator

### POST /api/simulations — GOVERNMENT_OPERATOR, DISPATCHER, ADMIN, ANALYST

Body (the spec's example):

```json
{ "scenarioType": "FLASH_FLOOD", "rainfallRate": 65, "stormDuration": 4.5,
  "drainageThroughput": 75, "tidalSurge": 1.8, "temperature": 28.4 }
```

Optional: `name`, `zoneId` (restrict to one zone). Severity derivation is transparent: `effectiveRainfall = rainfall × min(1.4, 100/drainageThroughput) + tidalSurge × 12` (≥80 CRITICAL, ≥55 HIGH, ≥30 MODERATE), heat thresholds (≥45/40/35 °C), wind thresholds (≥100/80/60 km/h); the worst driver wins. Then the **real risk engine** projects every asset and results are persisted (`Simulation` + one `SimulationResult` per zone) — everything in one transaction, audited `SIMULATION_STARTED` + `SIMULATION_COMPLETED`.

```json
{
  "success": true,
  "data": {
    "id": "sim_...", "name": "FLASH_FLOOD scenario", "scenarioType": "FLASH_FLOOD", "status": "COMPLETED",
    "parameters": { "rainfallRate": 65, "stormDuration": 4.5, "drainageThroughput": 75, "tidalSurge": 1.8, "temperature": 28.4 },
    "results": [ {
      "zoneName": "East Basin", "riskScore": 88, "riskLevel": "CRITICAL", "affectedAssets": 4, "affectedRoads": 1,
      "estimatedPopulation": 11200, "estimatedDamage": { "totalUsd": 9520000, "residentialUsd": 5712000, "infrastructureUsd": 3808000 },
      "recommendedActions": ["Pre-deploy pump crews to drains with vulnerability above 70.", "..."] } ],
    "summary": { "worstZone": "East Basin", "maxRiskScore": 88, "totalAffectedAssets": 9, "totalAffectedRoads": 2, "totalPopulationExposed": 46262, "totalDamageUsd": 39322700 }
  }
}
```

### GET /api/simulations — authenticated

Query: `page` `limit` `scenarioType` `status`. Paginated `SimulationDto` (with results + summary).

### GET /api/simulations/:id — authenticated

Single simulation. `404 SIMULATION_NOT_FOUND`.

---

## Analytics

### GET /api/analytics/overview — authenticated

```json
{
  "dataQuality": "SYNTHETIC_DEMO",
  "incidentTrends": [ { "date": "2026-08-28", "count": 0 }, "...14 daily buckets" ],
  "responsePerformance": { "avgResponseMinutes": 7, "avgCompletionMinutes": 104, "slaCompliancePercent": 75 },
  "incidentsBySeverity": [ { "key": "CRITICAL", "count": 2 } ],
  "infrastructureFailures": { "failuresByAssetType": [...], "nonOperationalByType": [...], "historicalEventCount": 13 },
  "hazardFrequency": { "historicalByHazardType": [ { "key": "FLASH_FLOOD", "count": 2 } ] },
  "hotspotRecurrence": [ { "name": "East Basin Flood Corridor", "recurrenceScore": 0.86 } ],
  "departmentPerformance": [ { "departmentName": "Public Works", "totalUnits": 5, "availableUnits": 3, "deployedUnits": 2, "activeTasks": 2, "avgCompletionMinutes": 90 } ],
  "resourceUtilization": { "unitsByStatus": [...], "deployed": 3, "totalUnits": 12, "utilizationPercent": 25 }
}
```

---

## Historical Hotspots

### GET /api/hotspots — authenticated

Query: `page` `limit` `hazardType` `zoneId` `severity` (min severityScore floor: LOW 0 / MODERATE 45 / HIGH 65 / CRITICAL 85) `minRecurrence` (0-1). Ordered by `recurrenceScore` desc. Card: `{ id, name, zone, hazardType, eventCount, severityScore, recurrenceScore, lastOccurredAt, latitude, longitude, description }`.

### GET /api/hotspots/:id — authenticated

Hotspot + zone + the 10 most recent related `SYNTHETIC_DEMO` historical events.

---

## Departments

| Endpoint | Notes |
|---|---|
| `GET /api/departments` | Query `page` `limit` `type`; includes `unitCount` + `activeTaskCount` |
| `GET /api/departments/:id` | Detail + users (no passwordHash) + counts |
| `GET /api/departments/:id/units` | Query `page` `limit` `status` |
| `GET /api/departments/:id/readiness` | Fleet readiness: `{ fleet: { totalUnits, available, deployed, busy, offline, utilizationPercent, readinessPercent }, workload: { activeTasks, completedTasks30d, avgCompletionMinutes, slaCompliancePercent }, posture: READY | HIGH_DEMAND | SATURATED }` |

---

## Audit

### GET /api/audit — ADMIN, GOVERNMENT_OPERATOR

Query: `page` `limit` `action` `entityType` `entityId` `userId`. Returns the immutable operational trail with actor info. Recorded actions include: `AUTH_LOGIN`, `AUTH_LOGIN_FAILED`, `INCIDENT_VIEWED`, `INCIDENT_CREATED`, `INCIDENT_UPDATED`, `INCIDENT_STATUS_CHANGED`, `HAZARD_CREATED`, `TASK_CREATED`, `TASK_ACKNOWLEDGED`, `TASK_STARTED`, `TASK_COMPLETED`, `TASK_CANCELLED`, `TASK_VERIFIED`, `UNIT_ASSIGNED`, `UNIT_STATUS_CHANGED`, `SIMULATION_STARTED`, `SIMULATION_COMPLETED`, `ASSET_UPDATED`, `ASSET_TEAM_ASSIGNED`, `ASSET_MAINTENANCE_REQUESTED`, `TRAFFIC_REROUTED`, `RESPONSE_PLAN_CREATED`, `DEMO_DATA_SEEDED`.

---

## Live Weather (location-aware)

### GET /api/weather/current?latitude=&longitude=&forecastHours= — authenticated

Calls the Open-Meteo live provider (no API key). **No seed/DB dependency** — the provider is authoritative for current observations. Served from a short-lived in-memory cache (`WEATHER_CACHE_SECONDS`, key = coords rounded to ~110 m). Validate `latitude` ∈ [-90, 90], `longitude` ∈ [-180, 180], `forecastHours` ∈ [0, 24].

```json
{
  "success": true,
  "data": {
    "location": { "latitude": 16.5062, "longitude": 80.648 },
    "provider": "Open-Meteo",
    "dataQuality": "LIVE_OBSERVED",
    "observedAt": "2026-09-10T16:15:00.000Z",
    "fetchedAt": "2026-09-10T16:19:36.000Z",
    "freshnessSeconds": 278,
    "temperatureC": 28.8, "apparentTemperatureC": 34.0, "humidityPercent": 76,
    "precipitationMm": 0, "rainfallMmPerHour": 0,
    "windSpeedKmh": 6, "windDirectionDeg": 342, "windDirectionCardinal": "NNW",
    "weatherCode": 3, "weatherCondition": "Overcast", "isDay": true,
    "forecast": [ { "time": "...", "dataQuality": "FORECAST", "temperatureC": 28.1, "precipitationMm": 0.2, "rainfallMmPerHour": 0.2 } ],
    "derivedAssessment": {
      "dataQuality": "MODELED",
      "floodSeverity": null, "heatSeverity": null, "windSeverity": null, "overallSeverity": null,
      "explanation": "No hazard driver exceeds documented thresholds; modeled severity is null."
    },
    "zone": { "id": "zone_...", "name": "...", "code": "...", "boundaryDataQuality": "SYNTHETIC_DEMO" },
    "waterDepthM": null,
    "notes": ["Live flood-depth source unavailable: waterDepth is null (no accessible gauge/hydrology provider integrated). Rainfall is live independently."]
  }
}
```

Rules: missing provider fields are `null` (never invented); `weatherCondition` uses the provider's documented WMO-code table (unknown codes → `null`); `derivedAssessment` uses deterministic thresholds (rain mm/hr ≥70/50/30, temp °C ≥45/40/35, wind km/h ≥90/70/60) and is explicitly `MODELED`, never an observation; `waterDepthM` is always `null` (no live hydrology feed integrated); zone resolution uses stored boundary polygons — **real GCC zones (`REAL_GEOGRAPHIC`) take precedence** over synthetic demo boundaries; unmatched coordinates return `zone: null`.

Errors: `400 VALIDATION_ERROR` · `401` · `502 WEATHER_PROVIDER_ERROR / WEATHER_PROVIDER_UNAVAILABLE`.

### GET /api/weather/history?zoneId=&page=&limit= — authenticated

Query: `zoneId` (id or code), `page`, `limit`. Persisted `WeatherSnapshot` rows written by the background zone poller (`WEATHER_POLL_INTERVAL_MINUTES`; disabled in test env, `0` disables). Items include provider, `dataQuality: LIVE_OBSERVED`, measurements, `observedAt`, zone info.

---

## Location Overview (Live Map point query)

### GET /api/location/overview?latitude=&longitude=&radiusKm=&assetLimit= — authenticated

**Primary endpoint for the Live Map location picker.** Composes everything for a selected coordinate in one call — the frontend must not duplicate this logic.

Query parameters:

| Param | Required | Default | Range |
|---|---|---|---|
| `latitude` | yes | — | −90…90 |
| `longitude` | yes | — | −180…180 |
| `radiusKm` | no | `5` | 0.5…25 (nearby asset search radius) |
| `assetLimit` | no | `12` | 1…50 (max nearby assets returned) |

Flow: coordinates → live Open-Meteo weather → containing zone (real GCC polygon when matched) → nearby infrastructure (haversine within `radiusKm`, distance-ordered) → active zone hazards → deterministic risk on nearest assets using **live weather as input** (`MODELED`) → zone cascade (`MODELED`) → alerts (`UNKNOWN`, empty unless a legitimate feed is integrated).

```json
{
  "success": true,
  "data": {
    "location": { "latitude": 13.0067, "longitude": 80.2562 },
    "radiusKm": 2,
    "weather": {
      "provider": "Open-Meteo",
      "dataQuality": "LIVE_OBSERVED",
      "temperatureC": 29,
      "rainfallMmPerHour": 0,
      "weatherCondition": "Overcast",
      "derivedAssessment": { "dataQuality": "MODELED", "overallSeverity": null },
      "waterDepthM": null,
      "zone": { "code": "GCC-Z13", "name": "Zone 13 Adyar", "boundaryDataQuality": "REAL_GEOGRAPHIC" }
    },
    "zone": { "id": "...", "code": "GCC-Z13", "name": "Zone 13 Adyar", "boundaryDataQuality": "REAL_GEOGRAPHIC" },
    "nearbyAssets": [
      {
        "assetCode": "OSM-ROAD-...",
        "name": "Sardar Patel Road",
        "type": "ROAD",
        "distanceKm": 0.42,
        "source": "OpenStreetMap",
        "dataQuality": "REAL_GEOGRAPHIC"
      }
    ],
    "hazards": [],
    "alerts": {
      "items": [],
      "dataQuality": "UNKNOWN",
      "note": "No official public alert feed (IMD/CWC/state DMA) is integrated..."
    },
    "risk": {
      "dataQuality": "MODELED",
      "model": "deterministic-risk-engine",
      "inputs": { "weather": { "dataQuality": "LIVE_OBSERVED", "provider": "Open-Meteo", "observedAt": "..." } },
      "assets": [
        { "assetCode": "...", "distanceKm": 0.42, "dataQuality": "MODELED", "risk": { "score": 12, "level": "LOW", "confidence": 0.85, "factors": [] } }
      ]
    },
    "cascade": { "dataQuality": "MODELED", "zone": { "code": "GCC-Z13" }, "riskScore": 0, "cascade": [] }
  }
}
```

Rules: coordinates outside every stored boundary → `zone: null`, `cascade: null`, `nearbyAssets: []` (weather still fetched live); nearby assets are never invented; risk/cascade are always `MODELED`; alerts are always `UNKNOWN` until a verified public feed is integrated.

Errors: `400 VALIDATION_ERROR` · `401` · `502 WEATHER_PROVIDER_*` (when live weather fetch fails).

---

## Reference — enums & policies

**Roles**: `ADMIN` `GOVERNMENT_OPERATOR` `DISPATCHER` `FIELD_OPERATOR` `ANALYST`
**DepartmentType**: `PUBLIC_WORKS` `FIRE_RESCUE` `EMS` `POLICE` `UTILITIES` `WATER` `TRANSPORT` `EMERGENCY_MANAGEMENT`
**AssetType**: `HOSPITAL` `SUBSTATION` `PUMPING_STATION` `ROAD` `BRIDGE` `EVACUATION_SHELTER` `COOLING_CENTER` `DRAIN` `WATER_TREATMENT` `GENERATOR` `FIRE_STATION` `AMBULANCE_GATE` `OTHER`
**Criticality / Severity / RiskLevel**: `LOW` `MODERATE` `HIGH` `CRITICAL`
**OperationalStatus**: `OPERATIONAL` `DEGRADED` `AT_RISK` `COMPROMISED` `OFFLINE`
**HazardType**: `FLOOD` `FLASH_FLOOD` `EXTREME_HEAT` `STORM` `HIGH_WIND` `DRAINAGE_OVERFLOW` `POWER_FAILURE` `OTHER`
**IncidentType**: `FLOODING` `INFRASTRUCTURE_FAILURE` `POWER_FAILURE` `ROAD_BLOCKAGE` `HEAT_EMERGENCY` `DRAINAGE_FAILURE` `MEDICAL_ACCESS` `EVACUATION` `OTHER`
**IncidentStatus**: `NEW` `ACKNOWLEDGED` `IN_PROGRESS` `RESOLVED` `CLOSED`
**UnitType**: `FIRE_RESCUE` `EMS` `PUBLIC_WORKS` `POLICE` `UTILITY` `PUMP_CREW` `BARRIER_CREW` `HEAVY_EQUIPMENT` `MUTUAL_AID`
**UnitStatus**: `AVAILABLE` `ASSIGNED` `EN_ROUTE` `ON_SCENE` `BUSY` `OFFLINE`
**TaskStatus**: `ASSIGNED` `ACKNOWLEDGED` `IN_PROGRESS` `COMPLETED` `CANCELLED`
**Priority**: `LOW` `MEDIUM` `HIGH` `CRITICAL`
**ScenarioType**: `ATMOSPHERIC_RIVER` `FLASH_FLOOD` `EXTREME_HEAT` `STORM` `CUSTOM`
**CascadeImpactType**: `INUNDATED` `OVERWHELMED` `PUMP_FAILURE` `POWER_LOSS` `POWER_AT_RISK` `ON_BACKUP_POWER` `BACKUP_ENGAGED` `ACCESS_BLOCKED` `AMBULANCE_DELAYED` `THERMAL_OVERLOAD` `THERMAL_STRESS` `OVERCAPACITY` `DEGRADED`

**SLA policy** (hours to resolve): CRITICAL 2 · HIGH 4 · MODERATE 8 · LOW 24.
**Risk buckets**: ≥80 CRITICAL · ≥60 HIGH · ≥40 MODERATE · else LOW.
**Exposure factors** (share of zone population): CRITICAL 0.55 · HIGH 0.35 · MODERATE 0.18 · LOW 0.08.
