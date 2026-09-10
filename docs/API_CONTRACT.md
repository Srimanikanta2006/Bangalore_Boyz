# API Contracts

## Overview
This document defines the interface specifications between system components (Frontend, Backend, External Services, and AI Agents). All developers and AI coding agents must adhere strictly to these contracts.

---

## Guidelines for API Modifications
1. **No Breaking Changes**: Do not alter request or response shapes without updating `docs/API_CONTRACT.md` and gaining team alignment.
2. **Structured Communication**: Prefer structured JSON payload schemas over unvalidated free-form strings.
3. **Documentation Sync**: When an API endpoint is created or modified, update this contract, client implementations, server handlers, and corresponding tests simultaneously.

---

## Endpoint Specifications

### Status & Health Check
* **STATUS**: [UNDECIDED - To be updated when backend endpoints are created]

```http
GET /api/health
```

#### Response (200 OK)
```json
{
  "status": "healthy",
  "timestamp": "2026-09-10T10:00:00Z"
}
```

---

## Agent Communication Schemas

### Standard Agent Output Schema
```json
{
  "task_id": "STRING",
  "agent_name": "STRING",
  "status": "completed | failed | in_progress",
  "data": {},
  "errors": [],
  "timestamp": "STRING"
}
```
