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
* **Purpose**: Autonomous task execution, data analysis, and domain-specific AI processing.
* **Architecture**: Structured orchestrator managing single/multi-agent workflows with validated JSON data exchange.
* **Tech Stack**: [STATUS: UNDECIDED - To be updated based on problem statement]

---

## Important Architectural Boundaries

1. **Frontend / Backend Separation**: The frontend communicates exclusively via defined REST/GraphQL APIs or SDK interfaces.
2. **Orchestration / Agent Isolation**: Individual AI agents perform modular tasks and pass structured outputs back to the orchestrator.
3. **Database Security**: The frontend never connects directly to PostgreSQL; the API validates JWTs and performs all database access through Prisma.
