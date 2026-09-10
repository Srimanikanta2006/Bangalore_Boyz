# Bangalore_Boyz

Welcome to the **Bangalore_Boyz** shared project repository!

---

## 📌 Repository Overview

This repository is designed to be the **single source of truth** for our team, supporting multi-developer collaboration across different AI coding environments (Antigravity, Cursor, Windsurf, Claude Code, VS Code).

---

## 📁 Project Structure

```text
Bangalore_Boyz/
├── AGENTS.md               # Primary AI Coding Agent Rules & Guidelines
├── README.md               # Project overview & quickstart
├── .env.example            # Environment variable template
├── .gitignore              # Git ignore rules protecting secrets & local files
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

1. **Read Team Guidelines**:
   - Check [AGENTS.md](file:///c:/Users/nidhi/OneDrive/Desktop/swarandra/Bangalore_Boyz/AGENTS.md) for AI agent coding rules.
   - Review [DEVELOPMENT.md](file:///c:/Users/nidhi/OneDrive/Desktop/swarandra/Bangalore_Boyz/docs/DEVELOPMENT.md) for environment setup.

2. **Setup Local Environment**:
   ```bash
   cp .env.example .env
   ```

3. **Local database**:
   - Start the bundled Docker PostgreSQL service from `cline_backend/`.
   - Keep credentials and API keys in local `.env` files; never commit them.

4. **Git Workflow**:
   - Create feature branches for all new work: `git switch -c feature/<short-description>`
   - Inspect changes with `git status` and `git diff` before pushing.
