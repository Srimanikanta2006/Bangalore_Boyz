# ClimateShield Orchestration

Incident-response **orchestrator** that coordinates the specialist AI agents in
[`agents/`](../agents) into a single **PROPOSED** response plan for operator
approval. See [`docs/ORCHESTRATION.md`](../docs/ORCHESTRATION.md) for the full
design.

## Pipeline

```
IncidentFacts (verified engine output)
        -> risk-analyst -> cascade -> dispatch-planner -> comms -> validation
        -> ResponsePlan (PROPOSED, requiresOperatorApproval)
```

## Guarantees

- **Grounded**: agents receive only verified engine facts; no invented assets,
  no invented actions (controlled catalog), risk score never recomputed.
- **Never a single point of failure**: any agent that has no model or fails
  validation degrades to a deterministic fallback. Runs offline with **no API
  key**.
- **Human-in-the-loop**: output is always `status: "PROPOSED"` with
  `requiresOperatorApproval: true`. Nothing is executed.
- **Persisted state**: each run is written to `.runs/<runId>.json` (gitignored)
  — state never lives only in LLM memory.

## Install & run

```bash
npm --prefix orchestration install     # links ../agents via file: dependency
npm --prefix orchestration run typecheck
npm --prefix orchestration test        # node:test via tsx
npm --prefix orchestration run demo    # end-to-end against the INC-204 fixture
```

Set `GEMINI_API_KEY` (and optionally `GEMINI_MODEL`) to run the specialist
agents against a live model; without it the pipeline uses deterministic
fallbacks and still produces a complete plan.

## Programmatic use

```ts
import { runIncidentResponse } from "@climateshield/orchestration";
import { incidentFixtureINC204 } from "@climateshield/agents";

const { plan } = await runIncidentResponse(incidentFixtureINC204);
// plan.status === "PROPOSED"; feed plan.dispatch.recommendedActions into the
// operator-approval UI, which POSTs approved actions to /api/tasks.
```
