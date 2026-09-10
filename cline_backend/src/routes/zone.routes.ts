import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as zoneService from '../services/zone.service';
import { wrap } from '../utils/wrap';

const router = Router();

const zoneQuerySchema = paginationQuerySchema.extend({
  riskLevel: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
});

const listZones = wrap(async (req, res) => {
  const data = await zoneService.listZones(req.query as { riskLevel?: string; page?: number; limit?: number });
  res.json({ success: true, data });
});

const getZone = wrap(async (req, res) => {
  const data = await zoneService.getZone(req.params.id);
  res.json({ success: true, data });
});

router.get('/zones', authenticate, validate(zoneQuerySchema, 'query'), listZones);
router.get('/zones/:id', authenticate, getZone);

export default router;
