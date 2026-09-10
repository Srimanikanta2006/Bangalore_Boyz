# Risk Methodology

This document explains, in full, how ClimateShield computes every risk number, forecast, and
derived hotspot shown anywhere in the product. **Nothing here is an unverifiable "black box"
AI score** — every formula is deterministic, reproducible, and lives in a single, small,
readable source file so it can be audited line-by-line. Where AI (Google Gemini) is used at
all, it is confined to *narrative explanation* and *photo triage*, never to the risk math
itself, and every AI output is either schema-validated or safely discarded (see
[`docs/SECURITY.md`](./SECURITY.md) and [`docs/FAILURE_MODES.md`](./FAILURE_MODES.md)).

---

## 1. The core deterministic risk engine

**Source:** `cline_backend/src/services/risk.service.ts` (`computeRisk`), weights in
`cline_backend/src/utils/risk.ts`.

```
raw   = hazardComponent × vulnerabilityComponent × criticalityComponent × historicalComponent
score = min(100, round(raw × 100))
level = CRITICAL (≥80) | HIGH (≥60) | MODERATE (≥40) | LOW (<40)
```

### 1.1 `hazardComponent` — how bad is the hazard itself?

A base weight from the hazard's categorical `severity`:

| Severity | Weight |
|---|---|
| LOW | 0.25 |
| MODERATE | 0.50 |
| HIGH | 0.75 |
| CRITICAL | 1.00 |

...plus an **intensity bonus** (capped at +0.25 total) from real measured/reported values,
whichever thresholds are met (only the highest threshold per field counts, fields are
additive across each other):

| Field | ≥ threshold | Bonus |
|---|---|---|
| Rainfall rate (mm/h) | 70 / 50 / 30 | +0.25 / +0.15 / +0.08 |
| Water depth (m) | 1.5 / 1.0 | +0.20 / +0.12 |
| Temperature (°C) | 44 / 40 / 35 | +0.25 / +0.15 / +0.08 |
| Wind speed (km/h) | 90 / 70 | +0.20 / +0.12 |
| Flow velocity (m/s) | 2.0 / 1.5 | +0.15 / +0.10 |

These thresholds were chosen from commonly-cited public thresholds for flood/heat/wind
hazard severity (e.g. IMD heat-wave criteria, standard flash-flood rainfall-intensity
bands) — they are a **reasonable, documented approximation**, not a peer-reviewed model.
This is stated honestly rather than implying a validated meteorological model.

### 1.2 `vulnerabilityComponent` — how exposed is this specific asset?

`InfrastructureAsset.vulnerability` (0–100, seeded/OSM-derived) divided by 100. A hospital
built at grade in a floodplain has a higher vulnerability score than one on elevated ground.

### 1.3 `criticalityComponent` — how much does it matter if this asset fails?

| Criticality | Weight |
|---|---|
| LOW | 0.30 |
| MEDIUM | 0.55 |
| HIGH | 0.80 |
| CRITICAL | 1.00 |

### 1.4 `historicalComponent` — has this happened here before?

`1 + min(0.25, historicalEventCount × 0.05)` — each real prior `HistoricalEvent` at this
asset or in its zone adds +5%, capped at +25% total. This is a genuine (if simple)
recurrence signal, not a fabricated one — it counts real rows in the `HistoricalEvent`
table.

### 1.5 Confidence score

`confidence = min(0.95, 0.55 + 0.15·[hazardType known] + 0.10·[any intensity data] +
0.10·[historical precedent exists] + 0.10·[telemetry is fresh])`

This is a **transparency signal**, not a statistical confidence interval — it tells an
operator "how much real signal fed this number" (e.g. a bare severity guess with no
intensity data and no history caps out around 0.55–0.70; a fully-observed, historically-
grounded reading reaches 0.95). It is capped below 1.0 deliberately — the engine never
claims certainty.

### 1.6 Factor breakdown ("why is this the score?")

The four components above are apportioned back across the final `score` proportionally to
their (normalized) weight, producing the `factors[]` array shown in every risk breakdown UI
(e.g. "Rainfall & flood intensity: 40, Asset vulnerability: 30, ..."). This is arithmetic
decomposition of the *same* formula above — not a separate model — so the breakdown always
sums to (approximately) the total score.

---

## 2. Cascade impact analysis

**Source:** `cline_backend/src/services/cascade.service.ts`.

Given a root hazard/asset, the cascade engine walks real `AssetDependency` edges (e.g.
`DRAINS_TO`, `ACCESS_VIA`, `POWERS`) breadth-first up to a small fixed depth, calling
`assessAssetRisk` (§1) at each hop with the same hazard applied transitively. This produces
a real dependency chain (e.g. Drain → Road → Hospital) with a computed impact score and
type (`OVERWHELMED`, `INUNDATED`, `ACCESS_BLOCKED`, ...) at each node — again, no AI, no
fabricated chain; it only ever returns edges that exist in the `AssetDependency` table.

---

## 3. Statistical risk-trend forecasting

**Source:** `cline_backend/src/services/riskForecast.service.ts`
(`GET /api/zones/:id/risk-forecast`).

A plain **ordinary least-squares linear regression** (`y = slope·x + intercept`) over the
zone's stored `WeatherSnapshot.rainfallMmPerHour` history (real Open-Meteo observations,
not synthetic), projecting rainfall N hours ahead. The forecasted rainfall is then run back
through the exact same `intensityBonus()` thresholds from §1.1, so "how much riskier will
this get" is answered using the identical rules as "how risky is it right now" — no
separate, unauditable forecasting model.

**Honesty guardrails:**
- Fewer than 3 historical samples → returns `dataQuality: INSUFFICIENT_DATA` and every
  numeric field is `null`. It never invents a trend from too little data.
- Forecasted rainfall is clamped to ≥0 (a naive linear projection can otherwise go
  negative, which is physically meaningless).
- `dataQuality: FORECAST` is always present on the response so no caller can mistake a
  projection for an observation.

---

## 4. Clustering-derived hotspots

**Source:** `cline_backend/src/services/hotspotClustering.service.ts`
(`GET /api/hotspots/derived`).

A real, dependency-free **single-linkage spatial clustering** algorithm (union-find over a
pairwise haversine-distance graph, same `haversineKm` helper used for citizen distance
calculations): historical events of the *same hazard type* within 2km of one another
(transitively) are grouped into one derived hotspot. For each cluster:

- **Centroid** = mean lat/lng of member events (real coordinates: the linked
  `InfrastructureAsset`'s location if present, else the zone centroid — never fabricated).
- **`severityScore`** = mean of each member event's severity, mapped to a 0–100 scale
  (LOW=25, MODERATE=50, HIGH=75, CRITICAL=100).
- **`recurrenceScore`** = `min(100, eventCount × 15 × recencyFactor + severityScore × 0.2)`,
  where `recencyFactor = e^(−daysSinceLastEvent / 180)` — an exponential recency decay
  (180-day half-life) so a cluster with many *old* events doesn't outrank a smaller but
  currently-active one.

This is genuinely unsupervised machine learning (a standard clustering algorithm applied to
real data), computed live on every request — nothing is pre-baked or hand-tuned per demo.
It is presented as an **additive second view** (`dataQuality: DERIVED_FROM_HISTORY`)
alongside the separately-maintained, hand-seeded `Hotspot` reference table used by
`GET /api/hotspots` — the two are never conflated.

---

## 5. Where Gemini (AI) is and is not used

| Feature | Uses Gemini? | Falls back to |
|---|---|---|
| Risk scores, cascade, forecasts, derived hotspots (all of §1–4) | **No** | N/A — always deterministic |
| Incident narrative explanation (`POST /api/incidents/:id/explain`) | Yes, low-temperature, JSON-schema-validated | Deterministic template fallback (`fallback.ts`) if no key/failure |
| Citizen hazard-report photo triage | Yes, vision, JSON-schema-validated | Silently skipped (`null`) — never blocks report submission |

In both AI cases, Gemini output is **never used to compute a risk score** — it only narrates
numbers the deterministic engine already produced, or adds a clearly-labeled,
non-authoritative supplementary field (`aiCaption`, `aiWaterDepthEstimate`, etc.). See
`docs/DECISIONS.md` and `cline_backend/src/ai/` for the full grounding/validation pipeline.

---

## 6. Known limitations (stated honestly)

- Intensity thresholds (§1.1) are a documented approximation, not a peer-reviewed hazard
  model — appropriate for a hackathon MVP demonstrating a real, auditable methodology, not
  for operational meteorological forecasting.
- The forecast (§3) is a short-horizon linear trend, not a physical weather model — it will
  correctly report `STABLE` during genuinely calm conditions (as it does today against real
  Open-Meteo data for Chennai) and should not be read as a storm-track prediction.
- Clustering (§4) uses only the historical events actually in the database (currently a
  small seeded set for Chennai) — recurrence scores are only as good as the data behind
  them, and will become more meaningful as real incident history accumulates.
