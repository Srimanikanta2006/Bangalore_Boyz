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
