# ClimateShield Agents

Specialist AI agents used by the incident-response
[`orchestration/`](../orchestration) layer. Each agent receives only **verified
engine facts** and emits **structured, validated JSON**.

| Agent | Output | Role |
|---|---|---|
| `RiskAnalystAgent` | `RiskAssessment` | Interprets the engine's risk facts (never recomputes the score). |
| `CascadeAgent` | `CascadeAnalysis` | Orders the verified dependency cascade into a critical path. |
| `DispatchPlannerAgent` | `DispatchPlan` | Proposes actions from the **controlled action catalog** only. |
| `CommsAgent` | `CommsBriefings` | Role-specific briefings (operator, hospital, field, public). |
| `ValidationAgent` | `ResponsePlan` | Deterministic grounding guard + integration into a PROPOSED plan. |

Design principles (see [`docs/ORCHESTRATION.md`](../docs/ORCHESTRATION.md)):

- **Grounded**: no invented assets, no invented actions, confidence capped at
  the engine's confidence.
- **Fallback-first**: every agent (`BaseAgent`) degrades to a deterministic
  synthesis on any LLM absence/failure — it never throws.
- **Pluggable LLM**: agents depend on the `LlmProvider` port; the default
  Gemini adapter is swappable, and `NullLlmProvider` forces deterministic mode.

This package has no build step of its own — it is consumed as TypeScript source
by `orchestration/` via a `file:` dependency.
