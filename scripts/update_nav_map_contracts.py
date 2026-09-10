import os

BASE_DIR = r"c:\Users\nidhi\OneDrive\Desktop\swarandra\Bangalore_Boyz"
NAV_MAP_PATH = os.path.join(BASE_DIR, "NAVIGATION_MAP.md")

with open(NAV_MAP_PATH, 'r', encoding='utf-8') as f:
    content = f.read()

contracts_section = """
---

## 4. Data Contracts (P1 / P2 / P4 Integration Specification)

This section documents the exact contract shapes consumed by the frontend, providing an explicit reference for **P1 (Infra/Task API)**, **P2 (Risk Engine)**, and **P4 (AI Agent)**.

### Contract Endpoint Mapping

| Screen / Feature | Consumed Contract | Mock File Path | Live Config Endpoint (`config.js`) | HTTP Method |
|------------------|-------------------|----------------|-----------------------------------|-------------|
| **Zone Detail & Overview** | **Contract 2** (P4 Explanation) | `data/explain-response.json` | `CONFIG.EXPLAIN_API_URL` (`/api/explain`) | `POST` / `GET` |
| **Operator Approval / Dispatch** | **Contract 3** (Task Creation) | `data/tasks-mock-response.json` | `CONFIG.TASK_API_URL` (`/api/tasks`) | `POST` |
| **Critical Assets & Hotspots** | **Contract 4** (Hotspot Intelligence) | `data/hotspots.json` | `CONFIG.HOTSPOTS_API_URL` (`/api/hotspots`) | `GET` |
| **Command Telemetry KPIs** | KPI Aggregate | `data/kpis.json` | `CONFIG.API_BASE_URL + "/kpis"` | `GET` |
| **Tactical Missions** | Mission Dossier | `data/missions.json` | `CONFIG.API_BASE_URL + "/missions"` | `GET` |
| **Safe Evacuation Routes** | Route Clearance | `data/routes.json` | `CONFIG.API_BASE_URL + "/routes"` | `GET` |

---

### Contract Shapes Summary

#### Contract 2 — P4 AI Agent Explanation Output Shape (`/api/explain`)
```json
{
  "incidentId": "INC-001",
  "situationSummary": "Heavy rainfall has exceeded local drainage threshold at Drain D07...",
  "causalChains": [
    {
      "path": ["D07", "R24", "Hospital-A"],
      "explanation": "Drain D07 capacity surge overflows onto Road R24...",
      "evidence": ["Rainfall threshold exceeded (42mm/h)"],
      "impact": "Impaired emergency medical response"
    }
  ],
  "keyImpacts": [
    { "assetId": "Hospital-A", "impact": "Ambulance Access Compromised", "severity": "critical" }
  ],
  "recommendedActions": [
    {
      "actionId": "dispatch_drainage_team",
      "targetAssetId": "D07",
      "priority": "critical",
      "reason": "Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
    }
  ],
  "uncertainties": ["Secondary storm cell trajectory ±15 mins"],
  "confidence": 0.88
}
```

#### Contract 3 — P3 Operator Task Creation Payload (`POST /api/tasks`)
*Triggered ONLY upon explicit human operator click on the **Approve** button.*
```json
{
  "incidentId": "INC-001",
  "actionId": "dispatch_drainage_team",
  "targetAssetId": "D07",
  "priority": "critical",
  "reason": "Reduce the risk of waterlogging at Drain D07 before it affects Road R24."
}
```

#### Contract 4 — P4 Hotspot Intelligence Shape (`/api/hotspots`)
```json
[
  {
    "hotspotId": "HS-D07-heavy_rainfall",
    "assetId": "D07",
    "hazardType": "heavy_rainfall",
    "incidentCount": 7,
    "recurrenceScore": 86,
    "severityScore": 82,
    "lastIncidentAt": "2026-08-14T12:15:00Z",
    "trend": "increasing",
    "confidence": 0.91,
    "explanation": "Drain D07 has experienced repeated heavy-rainfall incidents...",
    "recommendedLongTermAction": "drainage_capacity_upgrade"
  }
]
```
"""

if "## 4. Data Contracts" not in content:
    content += contracts_section
    with open(NAV_MAP_PATH, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Appended Data Contracts section to NAVIGATION_MAP.md")

