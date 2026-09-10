import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as zoneService from '../services/zone.service';
import { forecastZoneRiskTrend } from '../services/riskForecast.service';
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

/** GET /api/zones/:id/risk-forecast - statistical (linear regression) rainfall/risk
 *  trend forecast over stored WeatherSnapshot history. dataQuality: FORECAST. */
const riskForecast = wrap(async (req, res) => {
  const hoursAhead = req.query.hoursAhead ? Number(req.query.hoursAhead) : 6;
  const data = await forecastZoneRiskTrend(req.params.id, Number.isFinite(hoursAhead) ? hoursAhead : 6);
  res.json({ success: true, data });
});

router.get('/zones', authenticate, validate(zoneQuerySchema, 'query'), listZones);
router.get('/zones/:id/risk-forecast', authenticate, riskForecast);
router.get('/zones/:id', authenticate, getZone);

export default router;
