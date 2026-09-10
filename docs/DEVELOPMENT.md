# Development & Onboarding Guide

## Overview
Welcome to the `Bangalore_Boyz` project! This guide explains how to set up your local development environment, run the Docker PostgreSQL database, follow our Git workflow, and collaborate securely across different AI coding tools.

---

## Prerequisites
- **Git** installed and configured
- **Node.js** (v18+ recommended) or **Python** (v3.10+ recommended) depending on chosen tech stack
- **Docker Desktop / Docker Engine**: Required for the local PostgreSQL service.

---

## Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/Srimanikanta2006/Bangalore_Boyz.git
cd Bangalore_Boyz
```

### 2. Configure Environment Variables
Copy `.env.example` to create your local `.env` file:
```bash
cp .env.example .env
```
Fill in your project-specific values in `.env`.

> [!WARNING]
> Never commit your `.env` file or any real API keys, passwords, database URLs, or JWT secrets to Git!

---

## Local Docker PostgreSQL

From the `cline_backend/` directory, start and initialise the database:

```bash
cp .env.example .env
docker compose up -d
npm install
npm run prisma:deploy
npm run prisma:seed
npm run dev
```

The API uses `DATABASE_URL=postgresql://postgres:postgres@localhost:5432/climateshield` by default. The named Docker volume preserves data between restarts. `docker compose down -v` deletes that local data and should only be used when an intentional reset is required.

---

## Git Workflow

### Branching Strategy
Never commit directly to `main` unless explicitly instructed by the team.

1. Always pull latest `main` before starting new work:
   ```bash
   git switch main
   git pull origin main
   ```
2. Create a feature branch:
   ```bash
   git switch -c feature/<short-description>
   ```

### Pre-Commit Checklist
Before committing changes:
1. Run `git status` and `git diff` to verify only intended files are modified.
2. Verify `.env` or credential files are **NOT** staged (`git check-ignore -v .env`).
3. Ensure code builds and tests pass.
4. Update `docs/CURRENT_STATE.md` if significant milestones were completed.

### Committing & Pushing
```bash
git add .
git commit -m "feat: brief description of changes"
git push -u origin feature/<short-description>
```

---

## Working with AI Coding Tools (Antigravity, Cursor, Windsurf, Claude Code)

When launching an AI coding agent in this workspace:
1. Direct the agent to read `AGENTS.md` and `docs/*` first.
2. Ensure the agent respects architectural boundaries and minimal change principles.
3. Review agent changes using `git diff` before committing.
