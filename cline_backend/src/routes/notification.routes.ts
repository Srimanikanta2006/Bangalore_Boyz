import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import { GOVERNMENT_ROLES } from '../types/auth';
import * as notificationService from '../services/notification.service';
import { wrap } from '../utils/wrap';

const router = Router();

const notificationQuerySchema = paginationQuerySchema.extend({
  zoneId: z.string().optional(),
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
});

const acknowledgeAlertSchema = z.object({
  action: z.enum(['ACKNOWLEDGED', 'ESCALATED']).default('ACKNOWLEDGED'),
  note: z.string().max(500).optional(),
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

/**
 * PATCH /api/notifications/alerts/:id/acknowledge
 * Batch 3: Mark a sent alert as ACKNOWLEDGED or escalate it.
 * Tracks alert delivery lifecycle: QUEUED -> SENT -> DELIVERED -> ACKNOWLEDGED.
 */
const acknowledgeAlert = wrap(async (req, res) => {
  const { action, note } = req.body as z.infer<typeof acknowledgeAlertSchema>;
  const data = await notificationService.acknowledgeAlert(req.params.id, action, note, req.user!);
  res.json({ success: true, data });
});

router.get('/notifications', authenticate, validate(notificationQuerySchema, 'query'), listNotifications);
router.patch(
  '/notifications/alerts/:id/acknowledge',
  authenticate,
  requireRole(...GOVERNMENT_ROLES),
  validate(acknowledgeAlertSchema),
  acknowledgeAlert,
);

export default router;
