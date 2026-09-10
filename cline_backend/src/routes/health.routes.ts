import { Router } from 'express';
import { checkDatabaseConnection } from '../db/prisma';

const router = Router();

/** GET /api/health - public liveness + real database connectivity probe. */
router.get('/health', async (_req, res) => {
  const connected = await checkDatabaseConnection();
  res.status(connected ? 200 : 503).json({
    status: connected ? 'ok' : 'error',
    database: connected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
  });
});

export default router;
