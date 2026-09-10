# AI Agent Orchestration — Incident Response

This document describes the multi-agent **incident-response orchestrator**
implemented in the top-level [`agents/`](../agents) and
[`orchestration/`](../orchestration) packages.

---

## 1. Purpose

Given the deterministic engine's **verified facts** for an incident (risk score,
cascade graph, available units), produce a single, grounded, **PROPOSED**
response plan — risk read-out, cascade critical path, catalog-constrained
recommended actions, and role-specific briefings — for a human operator to
approve. Nothing is executed autonomously.

This builds on the existing single-shot explanation layer
(`cline_backend/src/ai/`) by turning it into a coordinated team of specialist
agents behind an explicit orchestrator, exactly as `AGENTS.md §7` prescribes.

---

## 2. Topology

```
                 IncidentFacts (verified engine output)
                                 |
                                 v
                          ORCHESTRATOR
             routing · state · retries · errors · completion
                                 |
     +-------------+-------------+-------------+-------------+
     v             v                           v             v
 RiskAnalyst    Cascade                 DispatchPlanner    Comms
     \_____________\_________________________/_____________/
                                 |
                                 v
                          ValidationAgent          (grounding guard + integrate)
                                 |
                                 v
             ResponsePlan  (PROPOSED · requiresOperatorApproval)
```

**Dependency ordering** (enforced by the orchestrator):

| Stage | Agent | Depends on |
|---|---|---|
| 1 | `risk-analyst` | facts |
| 2 | `cascade` | facts |
| 3 | `dispatch-planner` | facts + risk + cascade |
| 4 | `comms` | facts + dispatch |
| 5 | `validation` | all of the above |

---

## 3. Components

### `agents/` (specialist library)
- `types.ts` — structured JSON contracts (facts in, typed agent outputs, final `ResponsePlan`).
- `actionCatalog.ts` — the **controlled action catalog** (the only actions any agent may recommend, with allowed priorities).
- `llm/provider.ts` — the `LlmProvider` **port** + `NullLlmProvider` (deterministic-only mode).
- `llm/geminiProvider.ts` — Gemini adapter (JSON-only, low temperature, hard timeout, `fetch`-only).
- `agents/baseAgent.ts` — uniform lifecycle (LLM attempt → parse+validate → retry → deterministic fallback); an agent **never throws**.
- `agents/{riskAnalyst,cascade,dispatchPlanner,comms}Agent.ts` — the four specialists, each with an LLM prompt, strict parser, and deterministic fallback.
- `agents/validationAgent.ts` — deterministic integration + grounding guard.
- `fixtures/incidentFacts.ts` — synthetic `INC-204` facts for offline runs/tests.

### `orchestration/` (runnable coordinator)
- `orchestrator.ts` — routes facts through the agents in dependency order, records state, aggregates warnings, integrates the final plan.
- `state.ts` — per-run `RunState` persisted to `.runs/<runId>.json` (state never lives only in LLM memory, per `AGENTS.md §8`).
- `demo.ts` — end-to-end demo against the fixture.
- `tests/orchestrator.test.ts` — deterministic, live-LLM-mock, and grounding tests.

---

## 4. Grounding & safety guarantees

1. **No invented assets** — every `targetAssetCode` / cascade link is validated against the fact set; unknown assets are dropped.
2. **No invented actions** — recommended actions must be in the controlled catalog, at an allowed priority; violations are dropped.
3. **Risk is never recomputed** — agents echo the engine's score; `confidence` is hard-capped at the engine's confidence.
4. **AI is never a single point of failure** — no API key, timeout, bad JSON, or schema failure degrades that agent to a deterministic fallback; the run always completes.
5. **Human-in-the-loop** — the output is always `status: "PROPOSED"`, `requiresOperatorApproval: true`. Approved actions are dispatched by the backend via `POST /api/tasks` (unchanged contract).
6. **Auditable** — every correction is surfaced as a warning; every run is persisted.

---

## 5. Integration points (loose coupling)

- **Input**: `IncidentFacts` mirrors the shape of the backend's
  `getIncidentCascade()` output. A thin adapter (backend-side, future work) can
  map an incident id → `IncidentFacts` and call `runIncidentResponse()`.
- **Output**: `ResponsePlan.dispatch.recommendedActions` feeds the existing
  operator-approval UI (Contract 3), which POSTs approved actions to
  `/api/tasks`. No API contract changes are introduced by this layer.

---

## 6. Running

```bash
npm --prefix orchestration install
npm --prefix orchestration run typecheck
npm --prefix orchestration test
npm --prefix orchestration run demo
```

`GEMINI_API_KEY` (optional) enables live agents; without it the deterministic
fallbacks produce a complete plan.
