import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as notificationService from '../services/notification.service';
import { wrap } from '../utils/wrap';

const router = Router();

const notificationQuerySchema = paginationQuerySchema.extend({
  zoneId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
});

const listNotifications = wrap(async (req, res) => {
  const data = await notificationService.listSentAlerts({
    zoneId: req.query.zoneId as string | undefined,
    riskLevel: req.query.riskLevel as string | undefined,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json({ success: true, data });
});

router.get('/notifications', authenticate, validate(notificationQuerySchema, 'query'), listNotifications);

export default router;
