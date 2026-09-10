# ClimateShield Person 2 — Risk / Cascade / Route Engine

Deterministic intelligence layer. Person 4 explains this output; it does not calculate risk.

Temporary **in-memory Zone C graph**. Swap `pilotGraph.ts` for Person 1's `GET /api/graph` when that API exists. No extra dataset is required for Phase 1.

## Formula

```text
score = round( rainfallMmPerHour × vulnerability × max(1, historicalIncidents) × typeWeight / 180 × 100 )
clamped to 0–100
```

Drain `D07` (vulnerability 0.85, 3 historical incidents) becomes **HIGH at 40 mm/hr**.

## Graph

```text
D07 ─┬─ R24 ─ H01   (access, ETA 20 min)
     └─ S3  ─ H01   (power,  ETA 35 min)

ST01 ─┬─ R24 ─ H01   (high-risk when D07 floods)
      └─ R31 ─ H01   (safer alternate)
```

Traversal uses `GraphEdge` only. Paths are not hardcoded.

## Run the demo

From the repository root:

```powershell
node backend/src/engine/demo.ts
node backend/src/engine/demo.ts 60
```

## APIs (temporary Person 2 server)

```powershell
node backend/src/server.ts
```

| Method | Path | Notes |
| --- | --- | --- |
| `POST` | `/api/hazard/simulate` | Body `{ "rainfallMmPerHour": 40 }`, `source: simulated` |
| `GET` | `/api/risk/current` | Last scores |
| `GET` | `/api/cascade/:eventId` | One `CascadeEvent` |
| `GET` | `/api/explain-payload` | Person 4 `ExplainRequest` |
| `GET` | `/api/route/safe?from=ST01&to=H01` | Dijkstra, risk penalties |
| `GET` | `/api/graph` | Dummy assets + edges |

## Handoff to Person 4

`GET /api/explain-payload` (or `explainRequest` on the simulate response) matches `backend/src/ai/schemas.ts` `ExplainRequest`:

- `hazard`, `risk`, `affectedAssets`
- `causalChains` for D07 → R24 → H01 and D07 → S3 → H01
- `evidence`, `dataFreshness`, substation uncertainty

Person 4 can pass that object into `explainWithGeminiOrFallback`.

## Tests

```powershell
node --test backend/src/engine/*.test.ts
```
