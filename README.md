# ClimateShield

**Multi-tenant Climate Risk, Flood Resilience & Tactical Rescue Dispatch Platform**

ClimateShield connects **Citizens**, **Government Command HQ (EOC)**, **Field Rescue Taskforces**, and **Commercial Enterprise Partners** in a single real-time operational pipeline for disaster response — from live hazard detection to AI-assisted dispatch planning to on-the-ground rescue navigation.

Built and maintained by **Bangalore_Boyz**, with multi-developer collaboration across different AI coding environments (Antigravity, Cursor, Windsurf, Claude Code, VS Code).

---

## 🌍 What It Does

- **Citizen Portal** — interactive live-street maps, safe-route calculation around active flood zones, and one-touch SOS broadcasting (location, victim count, water depth) directly to Command HQ and the nearest rescue unit.
- **Government Command Center** — real-time incident maps with cascade/impact intelligence, infrastructure readiness tracking, downloadable vulnerability & SITREP reports, a CAD disaster simulator, and a commercial subscription/API hub for partner agencies.
- **Rescue Tactical Ops** — credential-verified field consoles for Fire, Police, and Ambulance units with turn-by-turn hazard-aware navigation.
- **Multi-region support** — dynamically adapts maps, telemetry, and incidents per active region (currently configured for Kathmandu's Bagmati flood basin and Chennai's East Basin flood zone, plus live GPS mode).
- **AI Agent Orchestration Layer** — specialist agents (Risk Analyst, Cascade, Dispatch Planner, Comms, Validation) coordinated by an explicit orchestrator that proposes an operator-approved response plan. Every agent has a deterministic fallback, so the pipeline runs even with no LLM API key — AI is never a single point of failure or an autonomous actor.

---

## 🛠 Tech Stack

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Leaflet / react-leaflet (GIS mapping), Recharts, React Router
- **Backend:** Node.js, Express, TypeScript, Prisma ORM, PostgreSQL (Docker locally / Supabase in production), JWT auth, Helmet, tiered rate limiting, WebSockets, Razorpay
- **AI/Orchestration:** TypeScript agent + orchestrator packages, pluggable `LlmProvider` (Gemini adapter) with deterministic fallback, grounded/controlled action catalog
- **Infra:** Docker Compose (local Postgres), Render (backend), Vercel (frontend SPA)

---

## 📁 Project Structure

```text
Bangalore_Boyz/
├── AGENTS.md               # Primary AI Coding Agent Rules & Guidelines
├── README.md               # Project overview & quickstart
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules protecting secrets & local files
├── client/                 # React/TypeScript frontend (citizen, gov, rescue portals)
├── server/                 # Lightweight Express/TypeScript API service
├── cline_backend/          # Main Express/Prisma backend (Government Ops / EOC)
├── agents/                 # Specialist AI agents (risk, cascade, dispatch, comms)
├── orchestration/          # Orchestrator coordinating agents into a response plan
├── docs/                   # Shared project documentation
│   ├── ARCHITECTURE.md     # System architecture overview
│   ├── API_CONTRACT.md     # API specifications & agent output schemas
│   ├── CURRENT_STATE.md    # Active status dashboard & completed tasks
│   ├── DECISIONS.md        # Architectural Decision Records (ADRs)
│   └── DEVELOPMENT.md      # Onboarding guide, Git workflow & Docker PostgreSQL setup
└── .agents/                # Team agent skills & local customizations
```

---

## 🚀 Quick Start

1. **Read Team Guidelines**
   - Check [`AGENTS.md`](./AGENTS.md) for AI agent coding rules.
   - Review [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) for full environment setup.

2. **Setup Local Environment**
```bash
   cp .env.example .env
```

3. **Local Database**
```bash
   # from cline_backend/
   npm run db:bootstrap   # starts Docker Postgres, runs migrations, seeds data
```

4. **Run the App**
```bash
   npm run dev            # frontend (client/)
   npm run dev:backend    # main backend (cline_backend/)
   npm run dev:server     # lightweight API (server/)
```

5. **Git Workflow**
   - Create feature branches for all new work: `git switch -c feature/<short-description>`
   - Inspect changes with `git status` and `git diff` before pushing.
   - No breaking API changes without updating `docs/API_CONTRACT.md` first.

---

## 📄 Docs Index

| Doc | Purpose |
|---|---|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | High-level system architecture |
| [`docs/API_CONTRACT.md`](./docs/API_CONTRACT.md) | REST endpoints & agent I/O schemas |
| [`docs/CURRENT_STATE.md`](./docs/CURRENT_STATE.md) | Live status, module walkthrough, verification results |
| [`docs/DECISIONS.md`](./docs/DECISIONS.md) | Architectural Decision Records (ADRs) |
| [`docs/DEVELOPMENT.md`](./docs/DEVELOPMENT.md) | Onboarding & environment setup |
