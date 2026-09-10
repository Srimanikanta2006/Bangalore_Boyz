# Security

This document describes the real, currently-implemented security posture of the ClimateShield
backend (`cline_backend/`) — every control below is verifiable in source and covered by tests
unless explicitly marked as a known gap in §7.

---

## 1. Authentication

- **Model:** stateless JWT, issued by our own Express backend (`src/services/auth.service.ts`)
  — **not** Supabase Auth (see `docs/DECISIONS.md` ADR-003). Supabase is used only as the
  Postgres host in shared-team environments.
- **Password storage:** `bcryptjs`, cost factor 10 (`bcrypt.hash(password, 10)`). Plaintext
  passwords are never logged or persisted; `passwordHash` is never returned by any API
  response (`tests/integration/critical-journey.test.ts` explicitly asserts this).
- **Token contents:** user id, role, email — no PII beyond what's already visible to an
  authenticated session. Signed with `JWT_SECRET` (required env var, no default in
  production), expiry controlled by `JWT_EXPIRES_IN` (default `12h`).
- **Transport:** `Authorization: Bearer <token>` header only — no cookies, no session
  storage server-side, so there is nothing to fixate/hijack via cookie-based attacks.
- **Login rate limiting:** 20 attempts / 15 minutes per IP (`express-rate-limit`,
  `src/routes/auth.routes.ts`) to slow credential-stuffing attempts.

## 2. Authorization (RBAC)

Six roles: `CITIZEN`, `FIELD_OPERATOR`, `DISPATCHER`, `GOVERNMENT_OPERATOR`, `ANALYST`,
`ADMIN` (see `docs/MASTER_PLAN.md` §5 for the full permission matrix). Enforcement is
**fail-closed** at two layers:

1. **Per-route `requireRole(...)` guards** (`src/middleware/auth.ts`) — every write endpoint
   explicitly allow-lists which roles may call it; anything not listed is `403 FORBIDDEN`.
2. **Global `blockCitizenFromInternal` middleware** (`src/app.ts`) — a defense-in-depth
   second layer that inspects the JWT independently of route-level guards and blocks any
   `CITIZEN` token from reaching internal/government read endpoints, even if a route guard
   were ever misconfigured. Verified in `tests/integration/citizen-auth.test.ts`.
3. **Ownership scoping**: citizen-facing read endpoints (`GET /citizen/reports/:id`,
   `GET /citizen/sos`) filter by `reporterId`/`userId` server-side — a citizen cannot
   enumerate or read another citizen's records (404, not 403, on a foreign id — no
   existence leakage).

## 3. Input validation

Every request body/query is validated with **Zod schemas** (`src/validators/*.ts`,
`src/middleware/validation.ts`) before it reaches business logic — malformed input is
rejected with `400 VALIDATION_ERROR` and never silently coerced into a DB write.
File uploads (`src/middleware/upload.ts`, multer): MIME-type allow-list (`jpg`/`png`/`webp`
only), 5MB per file, max 3 files per report — rejects anything else with
`415 UNSUPPORTED_MEDIA_TYPE` before it touches disk.

## 4. Transport & platform hardening

- `helmet()` — standard secure HTTP headers (CSP-adjacent headers, `X-Powered-By` removed,
  etc.) on every response.
- `cors()` — explicit allow-listed origins in production (`CORS_ORIGIN` env var);
  `*` is permitted only in local development (`env.allowAllOrigins`, gated by `NODE_ENV`).
- `app.set('trust proxy', 1)` — correct `req.ip` resolution behind a reverse
  proxy/load balancer (needed for accurate per-IP rate limiting).
- Request body size capped at `1mb` (`express.json({ limit: '1mb' })`) — bounds
  memory usage from a single malicious/broken request.

## 5. Abuse prevention (rate limiting)

Beyond login (§1), rate limiting is applied per-authenticated-user (falls back to IP for
unauthenticated calls) to the two citizen-facing write endpoints most exposed to spam:

| Endpoint | Limit | Rationale |
|---|---|---|
| `POST /citizen/sos` | 5 / 5 min | Genuine emergencies are rare in quick succession per person |
| `POST /citizen/reports` | 10 / 15 min | Generous for real multi-hazard reporting, bounds spam |

(`src/middleware/rateLimit.ts` — a shared factory, not copy-pasted per route.)

## 6. Audit trail

Every state-changing action (login, dispatch, status transitions, hazard creation, task
verification, etc.) writes an immutable `AuditLog` row (`src/services/audit.service.ts`) with
actor, action, entity, and metadata — queryable via `GET /api/audit` (government-only,
paginated, filterable). Audit writes are best-effort (never block the primary operation) but
failures are logged, never silently swallowed.

## 7. Secrets handling

- `.env` is git-ignored; `.env.example` documents every required variable name with a blank/
  placeholder value — no real secret has ever been committed to this repository's tracked
  history (see repository `.gitignore`).
- `GEMINI_API_KEY`, `REDIS_URL`, `DATABASE_URL`/`DIRECT_URL` are all optional or externally
  supplied; the application degrades gracefully (documented per-feature in
  `docs/FAILURE_MODES.md`) rather than crashing when any of them is absent.
- **Known incident (resolved):** a Supabase service-role key was pasted into a chat session
  during early shared-Supabase setup. It was **not** used by this backend (which is
  JWT-based, not Supabase-Auth-based — see ADR-003) and was flagged for rotation via the
  Supabase dashboard immediately upon discovery.

## 8. Known gaps (stated honestly, not hidden)

- **No external MFA / SSO** — single-factor password auth only, appropriate for a hackathon
  MVP demo, not yet production-hardened for a real municipal deployment.
- **No CSRF token** — acceptable because auth is Bearer-token-only (no cookies/ambient
  authority for a browser to auto-attach), which structurally avoids classic CSRF, but this
  should be re-verified if cookie-based auth is ever introduced.
- **`/metrics` is unauthenticated** (§ Chunk I) — standard for Prometheus scraping
  conventions, but should be firewalled to the metrics-scraper network only in a real
  production deployment (see `docs/ARCHITECTURE.md` deployment section).
- **No WAF / DDoS layer** — rate limiting is application-level only; a real production
  deployment would sit behind a CDN/WAF (e.g. Cloudflare) for network-layer protection.
- **External notification delivery (SMS/push) is not wired** — see
  `docs/FAILURE_MODES.md` and `cline_backend/src/notifications/delivery.service.ts`; no
  provider key is available in this environment, so this is explicitly a documented gap,
  not a fabricated integration.
