# System Architecture

## Overview
This document describes the high-level architecture of the `Bangalore_Boyz` project. It serves as the primary reference for all developers and AI agents working on the codebase.

---

## High-Level System Diagram

```text
                  +-------------------------+
                  |     Frontend Client     |
                  |  (Web / Interactive UI) |
                  +------------+------------+
                               |
                               v
                  +-------------------------+
                  |     Backend Service     |
                  |  (API & Business Logic) |
                  +------------+------------+
                               |
            +------------------+------------------+
            |                                     |
            v                                     v
+-----------------------+             +-----------------------+
|   Database & Backend  |             |     AI Agents &       |
| (Docker PostgreSQL)   |             |     Orchestration     |
+-----------------------+             +-----------------------+
```

---

## Component Breakdown

### 1. Frontend
* **Purpose**: User-facing application interface.
* **Tech Stack**: [STATUS: UNDECIDED - To be updated based on problem statement]
* **Responsibilities**: Render UI, handle user interactions, communicate with backend APIs.

### 2. Backend
* **Purpose**: Core application business logic, routing, and data processing.
* **Tech Stack**: [STATUS: UNDECIDED - To be updated based on problem statement]
* **Responsibilities**: Execute business logic, manage authentication, interface with database and AI agent orchestration layers.

### 3. Database (Docker PostgreSQL)
* **Provider**: Local Docker Compose service (`cline_backend/docker-compose.yml`, PostgreSQL 16).
* **Responsibilities**: Persistent application state used by the Express API through Prisma.
* **Access Model**: The API is the only database client used by the frontend. The named Docker volume persists local development data.

### 4. AI Agents & Orchestration Layer
* **Purpose**: Grounded decision-support for incident response — interpret verified engine facts and propose an operator-approved response plan (never autonomous execution).
* **Architecture**: Explicit orchestrator (`orchestration/`) coordinating specialist agents (`agents/`: Risk Analyst, Cascade, Dispatch Planner, Comms) in dependency order, followed by a deterministic Validation/integration stage that emits a single **PROPOSED** `ResponsePlan`. All exchange is validated JSON. See `docs/ORCHESTRATION.md`.
* **Tech Stack**: TypeScript/Node. LLM via a pluggable `LlmProvider` port (Gemini adapter); every agent has a deterministic fallback, so the pipeline runs with no API key and AI is never a single point of failure.
* **Grounding**: controlled action catalog, no invented assets/actions, risk never recomputed, confidence capped at engine confidence, per-run state persisted (`orchestration/.runs/`).

---

## Important Architectural Boundaries

1. **Frontend / Backend Separation**: The frontend communicates exclusively via defined REST/GraphQL APIs or SDK interfaces.
2. **Orchestration / Agent Isolation**: Individual AI agents perform modular tasks and pass structured outputs back to the orchestrator.
3. **Database Security**: The frontend never connects directly to PostgreSQL; the API validates JWTs and performs all database access through Prisma.
