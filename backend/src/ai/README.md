# ClimateShield AI Compound Cascade & Role-Specific Explanation Module

This module serves as ClimateShield's safe, sophisticated explanation layer. It synthesizes verified incident facts from the risk engine into structured operational intelligence.

> *"ClimateShield does not merely say what is at risk. It explains the competing cascade paths, tells each responder what matters to them, shows uncertainty, and recommends the safest sequence of human-approved actions."*

## Core Capabilities

1. **Compound Multi-Path Cascades**: Analyzes competing cascade paths (e.g. Cyclone + High Tide → Drain D07 overflow → Road R24 flood in 20 min vs. Substation S3 power risk in 35 min).
2. **Prioritized Action Sequencing**: Orders human-approved actions from the controlled catalog based on earliest cascade window and risk severity.
3. **Action Dependencies & Operator Decisions**: Declares prerequisite rules (e.g. *"Do not close Road R24 until verified alternate route is confirmed operational"*).
4. **Uncertainty & Verification Checks**: Flags unconfirmed assumptions and specifies explicit field checks within required time windows.
5. **Role-Specific Briefings**: Transforms the exact same verified incident facts into tailored briefings for:
   - **Operator**: Strategic overview, prioritization rationale, and dependency decisions.
   - **Hospital Manager**: Immediate facility access risks and power-continuity contingency activation.
   - **Field Drainage Team**: Critical bottleneck targets protecting downstream infrastructure.
   - **Public Advisory**: Clear, safe navigation warnings and municipal diversions.
6. **Controlled Action Catalog**: Recommends strictly validated action IDs (`dispatch_drainage_team`, `open_alternate_route`, `notify_facility`, `pre_position_ambulance`, `close_road`, `issue_local_advisory`).
7. **Deterministic Fallback**: Guaranteed offline availability with full compound synthesis whenever an LLM is unavailable or unconfigured.

## Response Schema

```json
{
  "incidentId": "INC-COMPOUND-001",
  "situationSummary": "This is not only a cyclone incident. It is a compound access-and-power continuity threat to Hospital A.",
  "causalChains": [
    {
      "path": ["Drain D07", "Road R24", "Hospital A"],
      "impact": "Ambulance access disruption",
      "etaMinutes": 20
    },
    {
      "path": ["Drain D07", "Substation S3", "Hospital A"],
      "impact": "Power-continuity risk",
      "etaMinutes": 35
    }
  ],
  "keyImpacts": [
    {
      "assetName": "Hospital A",
      "description": "Dual vulnerability: ambulance access disruption and backup-power risk",
      "timeHorizonMinutes": 20,
      "severity": "critical"
    }
  ],
  "recommendedActions": [
    {
      "actionId": "dispatch_drainage_team",
      "priority": "critical",
      "reason": "Inspect or clear Drain D07 immediately to prevent earliest cascade progression."
    }
  ],
  "actionDependencies": [
    {
      "actionId": "close_road",
      "dependsOnActionId": "open_alternate_route",
      "rule": "Do not close Road R24 until verified alternate route is confirmed operational."
    }
  ],
  "uncertainties": [
    {
      "statement": "Substation water ingress is not yet confirmed.",
      "requiredCheck": "Confirm substation status within 15 minutes."
    }
  ],
  "roleSpecificBriefings": {
    "operator": "Compound incident threatening Hospital A...",
    "hospitalManager": "Ambulance access via Road R24 may be disrupted in 20 minutes...",
    "fieldTeam": "Clear and inspect Drain D07 immediately...",
    "public": "Avoid Road R24 due to localized flooding risk..."
  },
  "confidence": 0.9,
  "explanation": "...",
  "impactSummary": "..."
}
```

## Run the Demo

From the repository root:

```powershell
node backend/src/ai/demo.ts
```

To run with Gemini (optional):

```powershell
$env:GEMINI_API_KEY = "your-api-key"
node backend/src/ai/demo.ts
```

## Run Tests

```powershell
node --test backend/src/ai/*.test.ts
```
