# Failure Modes

ClimateShield integrates several external, best-effort dependencies (weather providers, AI,
Redis, external notification channels). This document is the single reference for **what
happens when each one fails or is unavailable** — the guiding principle throughout the
codebase is:

> **A dependency that is down must degrade the experience, never crash the request, and
> must never silently fabricate a value in its place.**

Every row below is backed by a real code path and, in most cases, an explicit test.

---

## 1. External data providers

| Dependency | Used for | On failure/timeout | Evidence |
|---|---|---|---|
| **Open-Meteo weather API** | Live temperature/rainfall/wind (citizen + gov dashboards) | Returns `502 WEATHER_PROVIDER_ERROR` with no internal detail leaked; never returns a fabricated reading | `tests/integration/weather.test.ts` ("maps provider failures to 502 ... without leaking internals") |
| **Open-Meteo Air Quality API** | AQI on citizen nearby snapshot | That field is simply omitted (`null`); weather/hazards still returned | `tests/integration/citizen-nearby.test.ts` ("degrades gracefully when the AQI provider fails") |
| **Open-Meteo Flood/GloFAS API** | River discharge signal | `riverDischarge: null`, `safety` score computed without the flood signal | `src/services/flood.service.ts`, `tests/unit/flood-engine.test.ts` |
| **ReliefWeb API** | *Originally planned* live disaster-report panel | **Not integrated** — confirmed live during Chunk F that it requires a registered `appname` we don't have (`403`). Replaced with a static, cited historical reference instead of a broken/fabricated integration | `docs/MASTER_PLAN.md` §2/§3 correction |
| **SACHET CAP feed** | *Originally planned* live alert-feed ingestion | **Not integrated** — no confirmed working public URL found; feature scope reduced to CAP **export** only (which has no external dependency) | `docs/MASTER_PLAN.md` §2b correction |

## 2. AI (Google Gemini)

| Feature | On missing key / timeout / bad response | Evidence |
|---|---|---|
| Incident narrative explanation | Deterministic template fallback (`src/ai/fallback.ts`) — the UI always shows *something* grounded in real cascade facts, `usedFallback: true` is set so the frontend can label it | `tests/unit/explain-ai.test.ts` |
| Citizen photo triage | Returns `null` — the report submission **always succeeds** regardless; the AI caption/water-depth fields are simply absent from the response | `src/ai/photoTriageProvider.ts`, `tests/unit/photo-triage-ai.test.ts` |

In both cases, a malformed/invalid JSON response from the model is treated identically to a
network failure (schema validation runs before anything is trusted) — the model is never
allowed to inject an unvalidated shape into application state.

## 3. Async pipeline (BullMQ + Redis)

| Scenario | Behavior | Evidence |
|---|---|---|
| `REDIS_URL` unset (default) | The hazard-ingestion pipeline (risk recompute → notification fan-out → report generation) runs **inline, synchronously**, in the same process, right after hazard creation — same functions, same DB effects, just no queue | `src/queue/hazardPipeline.queue.ts` (`enqueueHazardIngested`), `tests/integration/hazard-pipeline.test.ts` |
| `REDIS_URL` set but Redis is down | `ioredis`'s `retryStrategy` caps at 3 quick retries then gives up silently (logged, not thrown); `getRedisConnection()` still returns a client object, so in practice a hard-down Redis after a previously-successful connection would surface as a job add failure, caught by `enqueueHazardIngested`'s try/catch and logged — **it never blocks or fails hazard creation itself** (the enqueue call is `void`, fire-and-forget) | `src/queue/redis.ts`, `src/queue/hazardPipeline.queue.ts` |
| A pipeline stage throws | Caught inside `enqueueHazardIngested`'s try/catch (inline mode) or surfaces via the BullMQ `Worker`'s `failed` event (queued mode, logged only) — either way, hazard creation itself already completed and returned successfully before the pipeline ran | `src/queue/hazardPipeline.queue.ts` |

## 4. Notification delivery (external channel)

No SMS/push provider (MSG91, Twilio, etc.) is configured in this environment. Every
delivery attempt is honestly recorded `deliveryStatus: NOT_CONFIGURED` — **never**
`DELIVERED`. In-app delivery (the `Notification` row itself, visible on next fetch) is
unconditional and unaffected. If a real provider key is added later, the same retry/backoff
policy (`src/notifications/deliveryPolicy.ts`) governs it: transient failures retry up to
`MAX_DELIVERY_ATTEMPTS` (3) before giving up (`FAILED`), a real success marks `DELIVERED`
with a timestamp. See `tests/unit/notification-delivery.test.ts`.

## 5. Database

| Scenario | Behavior |
|---|---|
| Postgres unreachable at boot | `GET /api/health` reports `database: "disconnected"` rather than crashing the whole process silently — see `src/routes/health.routes.ts` |
| Postgres unreachable mid-request | The Prisma call throws, `errorHandler.ts` maps it to a `5xx` JSON error envelope (never an unhandled stack trace leaked to the client) |
| Audit-log write fails | Caught and logged (`src/services/audit.service.ts`), never blocks the primary operation it was recording |

## 6. Rate limiting

Exceeding a configured rate limit returns a structured `429` with a specific `code`
(`RATE_LIMITED`, `SOS_RATE_LIMITED`, `REPORT_RATE_LIMITED`) — never a generic/opaque error,
so the frontend can show an accurate, specific message.

## 7. General principle applied everywhere above

Every external call in this codebase follows the same three-part contract:
1. **Try the real thing.**
2. **On any failure, degrade to a clearly-labeled null/fallback/skip — never fabricate a
   plausible-looking value in its place.**
3. **Never let an optional dependency's failure block a core user-facing action** (report
   submission, SOS, hazard creation, login) that doesn't actually need it to succeed.
