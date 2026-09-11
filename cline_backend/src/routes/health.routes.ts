import { Router } from 'express';
import { prisma, checkDatabaseConnection } from '../db/prisma';
import { getMetricsSnapshot } from '../services/metrics.service';
import { getWorkerStatus } from '../services/outboxWorker.service';

const router = Router();

router.get('/health', async (_req, res) => {
  const connected = await checkDatabaseConnection();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'error',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

router.get('/health/live', (_req, res) => {
  res.json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

router.get('/health/ready', async (_req, res) => {
  let dbPingMs = -1;
  let dbOk = false;
  try {
    const t0 = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbPingMs = Date.now() - t0;
    dbOk = true;
  } catch { /* db down */ }

  const worker = await getWorkerStatus().catch(() => ({ running: false, pending: 0, processing: 0, failed: 0, completed: 0, lastRunAt: null }));

  const body = {
    status: dbOk ? 'ready' : 'unhealthy',
    checks: {
      database: { status: dbOk ? 'connected' : 'disconnected', pingMs: dbPingMs },
      worker,
    },
    timestamp: new Date().toISOString(),
  };
  res.status(dbOk ? 200 : 503).json(body);
});

router.get('/metrics', (_req, res) => {
  res.json(getMetricsSnapshot());
});

export default router;
