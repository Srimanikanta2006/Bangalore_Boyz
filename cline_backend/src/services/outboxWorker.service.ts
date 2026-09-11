import { prisma } from '../db/prisma';
import { recordAsyncJob } from './metrics.service';

const POLL_INTERVAL_MS = 5000;
const BASE_BACKOFF_MS = 500;

let running = false;
let timer: ReturnType<typeof setTimeout> | null = null;
let lastRunAt: string | null = null;
let totalCompleted = 0;
let totalFailed = 0;

/** Process one pending event. Returns true if an event was processed. */
export async function processNextEvent(): Promise<boolean> {
  const candidate = await prisma.eventOutbox.findFirst({
    where: {
      OR: [
        { status: 'PENDING', nextAttemptAt: { lte: new Date() } },
        { status: 'RETRY_WAIT', nextAttemptAt: { lte: new Date() } },
      ],
    },
    orderBy: { createdAt: 'asc' },
  });
  if (!candidate) return false;

  // Optimistic claim
  const claimed = await prisma.eventOutbox.updateMany({
    where: { id: candidate.id, status: candidate.status },
    data: { status: 'PROCESSING', attempts: { increment: 1 } },
  });
  if (claimed.count === 0) return false;

  const attempts = candidate.attempts + 1;
  try {
    await handleEvent(candidate.eventType, candidate.payload as object);
    await prisma.eventOutbox.update({
      where: { id: candidate.id },
      data: { status: 'COMPLETED', processedAt: new Date() },
    });
    recordAsyncJob('completed');
    totalCompleted++;
    lastRunAt = new Date().toISOString();
    return true;
  } catch (err) {
    const lastError = err instanceof Error ? err.message : String(err);
    if (attempts >= candidate.maxAttempts) {
      await prisma.eventOutbox.update({
        where: { id: candidate.id },
        data: { status: 'DEAD_LETTER', lastError },
      });
      recordAsyncJob('deadLetter');
      totalFailed++;
    } else {
      const nextAttemptAt = new Date(Date.now() + BASE_BACKOFF_MS * 2 ** (attempts - 1));
      await prisma.eventOutbox.update({
        where: { id: candidate.id },
        data: { status: 'RETRY_WAIT', lastError, nextAttemptAt },
      });
      recordAsyncJob('retried');
    }
    return true;
  }
}

async function handleEvent(eventType: string, payload: object): Promise<void> {
  // eslint-disable-next-line no-console
  console.log(JSON.stringify({ level: 'info', scope: 'outbox', eventType, payload }));
  // Idempotent no-op handlers — real side effects can be added here per event type.
  // e.g. INCIDENT_CREATED -> background triage log, ALERT_CREATED -> delivery tracking
}

async function poll() {
  if (!running) return;
  try { await processNextEvent(); } catch { /* non-fatal */ }
  lastRunAt = lastRunAt ?? new Date().toISOString();
  if (running) timer = setTimeout(poll, POLL_INTERVAL_MS);
}

export function startWorker() {
  if (running) return;
  running = true;
  timer = setTimeout(poll, POLL_INTERVAL_MS);
}

export function stopWorker() {
  running = false;
  if (timer) { clearTimeout(timer); timer = null; }
}

export async function getWorkerStatus() {
  const [pending, processing, failed] = await Promise.all([
    prisma.eventOutbox.count({ where: { status: { in: ['PENDING', 'RETRY_WAIT'] } } }),
    prisma.eventOutbox.count({ where: { status: 'PROCESSING' } }),
    prisma.eventOutbox.count({ where: { status: { in: ['FAILED', 'DEAD_LETTER'] } } }),
  ]);
  return { running, pending, processing, failed, completed: totalCompleted, lastRunAt };
}
