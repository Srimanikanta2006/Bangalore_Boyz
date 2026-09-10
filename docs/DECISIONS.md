# Architectural Decision Records (ADR)

This file logs key architectural decisions, rationale, alternatives considered, and status.

---

## ADR-001: Use Supabase as Shared Database & Backend Service

* **Date**: 2026-09-10
* **Status**: Accepted

### Context
The team requires a unified, real-time, relational database and backend service accessible by multiple teammates working across different machines and AI tools during the hackathon.

### Decision
Use **Supabase** as the shared PostgreSQL database and backend infrastructure platform.

### Rationale
1. **Multi-Developer Support**: Team members can be added to the shared Supabase project using their own individual Supabase accounts.
2. **Feature Set**: Built-in support for PostgreSQL, Row-Level Security (RLS), Auth, Realtime, Storage, and Vector extensions (`pgvector`).
3. **No Credential Sharing**: Developers authenticate independently; no shared secrets or personal access tokens need to be committed to Git.

### Alternatives Considered
- **Local SQLite / Postgres**: Hard to synchronize real-time state across teammates.
- **Custom Docker Postgres**: Requires extra deployment infrastructure and port mapping setup during a short hackathon window.

---

## ADR-002: AI Coding Agent Governance via AGENTS.md and Repository Documentation

* **Date**: 2026-09-10
* **Status**: Accepted

### Context
Team members use different AI coding environments (Antigravity, Cursor, Windsurf, Claude Code, VS Code). AI tools lose context across sessions and editors.

### Decision
Establish `AGENTS.md` and `docs/*` as the single source of truth for all AI coding agents working in this repository.

### Rationale
Ensures portability, architectural consistency, and safety across all AI tools without relying on ephemeral chat histories.

---

## ADR-003: Multi-Agent Incident-Response Orchestrator (`agents/` + `orchestration/`)

* **Date**: 2026-09-11
* **Status**: Accepted

### Context
The single-shot grounded explanation endpoint (`POST /api/incidents/:id/explain`,
`cline_backend/src/ai/`) proved the grounding pattern but is one LLM call. The
architecture (`AGENTS.md §7`, `docs/ARCHITECTURE.md`) calls for an explicit
orchestrator coordinating specialist agents with validated JSON exchange.

### Decision
Implement a top-level **`agents/`** library (Risk Analyst, Cascade, Dispatch
Planner, Comms, Validation) and a top-level **`orchestration/`** coordinator that
runs them in dependency order and emits a single **PROPOSED** `ResponsePlan`.
Stack: **TypeScript/Node**, consistent with the existing AI layer; `agents/` is
linked into `orchestration/` via a `file:` dependency. Tests use the built-in
`node:test` runner via `tsx`. Zero runtime dependencies (global `fetch`).

### Rationale
1. **Reuses the proven grounding posture** — controlled action catalog, runtime
   validation, engine-confidence ceiling, deterministic fallback.
2. **AI is never a single point of failure** — every agent degrades to a
   deterministic fallback; the pipeline runs fully offline with no API key.
3. **Human-in-the-loop preserved** — output is always a PROPOSED plan requiring
   operator approval; approved actions still flow through the unchanged
   `POST /api/tasks` contract.
4. **State is persisted** (`orchestration/.runs/`), not held in LLM memory
   (`AGENTS.md §8`); agents are replaceable without losing run state.
5. **Loose coupling** — the layer consumes verified facts (shape-compatible with
   `getIncidentCascade()`) and emits structured JSON; no API/DB contract changes.

### Alternatives Considered
- **Extend the single explain call in-place**: less modular; harder to add/scale
  specialist agents; doesn't match the documented orchestrator topology.
- **Separate Python agent service**: adds a new runtime and dependency surface;
  duplicates the existing TypeScript Gemini/grounding primitives.

See `docs/ORCHESTRATION.md` for the full design.
