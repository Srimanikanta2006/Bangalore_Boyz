# TEAM AI CODING AGENT INSTRUCTIONS

## 1. PURPOSE

You are an AI coding agent working inside a shared team repository: **Bangalore_Boyz**.

Your job is to help the team design, implement, debug, test, document, and improve the project while preserving:

* The overall software architecture
* The agent/orchestration architecture
* Existing functionality
* API contracts
* Data models
* Database structure
* Project conventions
* Git workflow
* Documentation
* Work completed by other teammates
* Compatibility with other AI coding tools and editors (Cursor, Windsurf, Claude Code, Antigravity, VS Code, etc.)

NEVER assume that your own conversation history is the source of truth.
The repository itself must remain the single source of truth.

---

## 2. GOLDEN RULE

Before modifying anything:

1. Understand the existing project.
2. Read the relevant documentation (`README.md`, `AGENTS.md`, `docs/*`).
3. Understand the architecture.
4. Understand the current implementation.
5. Identify dependencies between components.
6. Determine what files need to change.
7. Make the smallest safe change required.
8. Test the change.
9. Update documentation/state if necessary.

Do NOT immediately start coding just because a task was given.

---

## 3. SOURCE OF TRUTH

The following files are authoritative project documents:

```text
AGENTS.md
README.md

docs/
├── ARCHITECTURE.md
├── API_CONTRACT.md
├── CURRENT_STATE.md
├── DECISIONS.md
└── DEVELOPMENT.md
```

If these files exist, read them before making significant changes.
If any of these files do not exist, create or update them when appropriate.
Never rely only on previous AI conversation history.

---

## 4. PROJECT ARCHITECTURE

The project maintains a clear separation of responsibilities.

A typical structure for this project is:

```text
Bangalore_Boyz/
│
├── frontend/
├── backend/
├── agents/
├── orchestration/
├── database/
├── services/
├── tests/
├── scripts/
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API_CONTRACT.md
│   ├── CURRENT_STATE.md
│   ├── DECISIONS.md
│   └── DEVELOPMENT.md
├── config/
├── .env.example
├── .gitignore
├── AGENTS.md
└── README.md
```

Keep components modular, clearly separated, independently understandable, and loosely coupled.

---

## 5. ARCHITECTURE FIRST

Before implementing a major feature, determine:

* Which component owns the feature?
* Which component calls it?
* What data enters it?
* What data leaves it?
* Which APIs are involved?
* Which agents are involved?
* Which orchestration flow is involved?
* Which database tables/state are involved?
* What existing components depend on it?

If a change affects architecture, explain the proposed change before implementing it.
Do not silently introduce architectural changes.

---

## 6. DO NOT BREAK EXISTING ARCHITECTURE

Never rewrite the architecture simply because you prefer another approach.
If you believe a different technology or structure is significantly better:

1. Explain why.
2. Identify affected components.
3. Identify migration cost.
4. Identify risks.
5. Wait for team approval before replacing existing architecture.

---

## 7. AGENT ARCHITECTURE & ORCHESTRATION

If the project contains AI agents, agents must have clearly defined responsibilities and flow through an explicit orchestrator:

```text
                 USER / PROBLEM
                       │
                       ▼
                ORCHESTRATOR
                       │
             ┌─────────┼─────────┐
             ▼         ▼         ▼
           AGENT      AGENT     AGENT
             │         │         │
             └─────────┼─────────┘
                       ▼
                  VALIDATION
                       │
                       ▼
                  INTEGRATION
                       │
                       ▼
                    RESULT
```

The orchestrator should control: task routing, agent invocation, dependencies, state, retries, validation, error handling, and completion conditions.

Agents should communicate using structured schemas (JSON) rather than unstructured free-form text wherever downstream code depends on predictable data.

---

## 8. STATE MANAGEMENT

Important project state must not exist only inside an AI agent's conversation memory.
Persist state using:

* Database (Supabase)
* JSON/state files
* APIs
* Git
* Project documentation

An agent should be replaceable without losing the project's important state.

---

## 9. API CONTRACTS & DATABASE

* **APIs**: Check `docs/API_CONTRACT.md`. Never silently change existing API request/response shapes. If an API must change, update contract, backend, frontend, tests, and documentation.
* **Database**: Treat Supabase schemas as shared infrastructure. Use migrations rather than manually mutating production schemas. Never delete existing data unless explicitly instructed.

---

## 10. FILE OWNERSHIP & MINIMAL CHANGE PRINCIPLE

* Do not modify files unrelated to your current task.
* Prefer small, safe changes followed by testing and committing over massive rewrites.
* Do not perform large-scale refactoring unless explicitly requested.

---

## 11. DEPENDENCIES & SECRETS

* **Dependencies**: Avoid dependency bloat. Check existing dependencies before adding new ones.
* **SECRETS & KEYS**: **NEVER COMMIT** `.env`, API keys, passwords, tokens, private keys, personal Supabase access tokens, or service-role keys.
* Always use `.env.example` to document required variable names with blank/placeholder values.

---

## 12. SUPABASE TEAM ARCHITECTURE

All team members connect to the same shared Supabase project using their individual Supabase accounts:

```text
GitHub Repository
        │
        ├──────────────────────┐
        ▼                      ▼
     Teammate A             Teammate B
        │                      │
 Own Supabase Account   Own Supabase Account
        │                      │
        └──────────┬───────────┘
                   ▼
         Shared Supabase Project (Database / Services)
```

Never share personal Supabase access tokens or commit service-role keys into Git.

---

## 13. GIT WORKFLOW & COMMITS

* **Branches**: Never work directly on `main` unless explicitly instructed.
  Create feature branches: `git switch -c feature/<short-description>`
* **Commits**: Write clear, descriptive commit messages (`feat: ...`, `fix: ...`, `docs: ...`).
* **Before Pushing**: Run `git status` and `git diff` to inspect changes, ensure no secrets are exposed, run relevant tests, and verify documentation is updated.
* **No Force Pushing**: Avoid `git push --force`.

---

## 14. HACKATHON PRIORITIES

During hackathons (e.g., 24-hour sprints):

1. Working solution
2. Stable architecture
3. Reliable integration
4. Demonstrable functionality
5. Testing critical paths
6. Clean code
7. Documentation
8. Optimization

Prefer a simple, reliable solution over a complicated, over-engineered architecture.

---

## 15. FINAL PRINCIPLE

The AI agent is an assistant, not the project owner. The team owns architecture, technology choices, security, data, APIs, agent behavior, and final implementation.

The repository must remain understandable even when switching between different AI editors (Cursor, Windsurf, Claude Code, Antigravity, VS Code).
