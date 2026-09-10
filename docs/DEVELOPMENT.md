# Development & Onboarding Guide

## Overview
Welcome to the `Bangalore_Boyz` project! This guide explains how to set up your local development environment, work with our shared Supabase backend, follow our Git workflow, and collaborate securely across different AI coding tools.

---

## Prerequisites
- **Git** installed and configured
- **Node.js** (v18+ recommended) or **Python** (v3.10+ recommended) depending on chosen tech stack
- **Supabase Account**: Ensure your account has been added as a collaborator to the team's shared Supabase project.

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
> Never commit your `.env` file or any real API keys, passwords, or Supabase service-role secrets to Git!

---

## Supabase Team Authentication Model

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

1. Each teammate logs in with their own Supabase credentials.
2. The repository `.env.example` provides required key names (`SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`).
3. Each developer keeps personal access tokens and service-role keys in their local `.env` or local tool configuration.

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
