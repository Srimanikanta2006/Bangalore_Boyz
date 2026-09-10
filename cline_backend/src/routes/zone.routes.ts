import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as zoneService from '../services/zone.service';
import * as notificationService from '../services/notification.service';
import { wrap } from '../utils/wrap';
import type { RiskLevel } from '@prisma/client';

const router = Router();

const zoneQuerySchema = paginationQuerySchema.extend({
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
});

const notifyZoneBodySchema = z.object({
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).default('CRITICAL'),
  message: z.string().optional(),
});

const listZones = wrap(async (req, res) => {
  const data = await zoneService.listZones(req.query as { riskLevel?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});

const getZone = wrap(async (req, res) => {
  const data = await zoneService.getZone(req.params.id);
  res.json({ success: true, data });
});

const notifyZone = wrap(async (req, res) => {
  const zoneId = req.params.id;
  const riskLevel = (req.body.riskLevel ?? 'CRITICAL') as RiskLevel;
  const customMessage = req.body.message;
  const data = await notificationService.notifyZoneSubscribers(zoneId, riskLevel, { customMessage });
  res.json({ success: true, data });
});

const getZoneNotifications = wrap(async (req, res) => {
  const data = await notificationService.listSentAlerts({
    zoneId: req.params.id,
    page: req.query.page ? Number(req.query.page) : undefined,
    limit: req.query.limit ? Number(req.query.limit) : undefined,
  });
  res.json({ success: true, data });
});

router.get('/zones', authenticate, validate(zoneQuerySchema, 'query'), listZones);
router.get('/zones/:id', authenticate, getZone);
router.post('/zones/:id/notify', authenticate, validate(notifyZoneBodySchema, 'body'), notifyZone);
router.get('/zones/:id/notifications', authenticate, getZoneNotifications);

export default router;
