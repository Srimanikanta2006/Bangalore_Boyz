import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { GOVERNMENT_ROLES } from '../types/auth';
import { paginationQuerySchema } from '../utils/pagination';
import * as hazardController from '../controllers/hazard.controller';

const router = Router();

const hazardTypeEnum = z.enum(['FLOOD', 'FLASH_FLOOD', 'EXTREME_HEAT', 'STORM', 'HIGH_WIND', 'DRAINAGE_OVERFLOW', 'POWER_FAILURE', 'OTHER']);
const severityEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);

const hazardQuerySchema = paginationQuerySchema.extend({
  type: hazardTypeEnum.optional(),
  severity: severityEnum.optional(),
  status: z.enum(['ACTIVE', 'MONITORING', 'RESOLVED', 'EXPIRED']).optional(),
  zoneId: z.string().min(1).optional(),
  activeOnly: z.enum(['true', 'false']).transform((v) => v === 'true').optional(),
});

const createHazardSchema = z.object({
  type: hazardTypeEnum,
  severity: severityEnum,
  zoneId: z.string().min(1),
  rainfallRate: z.coerce.number().min(0).max(300).optional(),
  waterDepth: z.coerce.number().min(0).max(20).optional(),
  flowVelocity: z.coerce.number().min(0).max(20).optional(),
  temperature: z.coerce.number().min(-20).max(60).optional(),
  windSpeed: z.coerce.number().min(0).max(150).optional(),
  durationMinutes: z.coerce.number().int().min(0).max(10080).optional(),
  source: z.enum(['OPERATOR', 'SIMULATOR', 'WEATHER_API', 'SENSOR']).optional(),
  startedAt: z.coerce.date().optional(),
});

router.get('/hazards', authenticate, validate(hazardQuerySchema, 'query'), hazardController.list);
router.get('/hazards/:id', authenticate, hazardController.get);
router.get('/hazards/:id/cap.xml', authenticate, requireRole(...GOVERNMENT_ROLES), hazardController.capXml);
router.post('/hazards', authenticate, requireRole(...GOVERNMENT_ROLES), validate(createHazardSchema), hazardController.create);

export default router;
