import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as hotspotController from '../controllers/hotspot.controller';

const router = Router();

const hotspotQuerySchema = paginationQuerySchema.extend({
  hazardType: z.enum(['FLOOD', 'FLASH_FLOOD', 'EXTREME_HEAT', 'STORM', 'HIGH_WIND', 'DRAINAGE_OVERFLOW', 'POWER_FAILURE', 'OTHER']).optional(),
  zoneId: z.string().min(1).optional(),
  severity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
  minRecurrence: z.coerce.number().min(0).max(1).optional(),
});

router.get('/hotspots', authenticate, validate(hotspotQuerySchema, 'query'), hotspotController.list);
router.get('/hotspots/:id', authenticate, hotspotController.get);

export default router;
