import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as unitController from '../controllers/unit.controller';

const router = Router();

const unitTypeEnum = z.enum(['FIRE_RESCUE', 'EMS', 'PUBLIC_WORKS', 'POLICE', 'UTILITY', 'PUMP_CREW', 'BARRIER_CREW', 'HEAVY_EQUIPMENT', 'MUTUAL_AID']);
const unitStatusEnum = z.enum(['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFFLINE']);

const unitQuerySchema = paginationQuerySchema.extend({
  status: unitStatusEnum.optional(),
  type: unitTypeEnum.optional(),
  departmentId: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
});

const unitStatusSchema = z.object({
  status: unitStatusEnum,
  note: z.string().max(1000).optional(),
});

router.get('/units', authenticate, validate(unitQuerySchema, 'query'), unitController.list);
router.get('/units/:id', authenticate, unitController.get);
router.patch(
  '/units/:id/status',
  authenticate,
  requireRole('GOVERNMENT_OPERATOR', 'DISPATCHER', 'ADMIN', 'FIELD_OPERATOR'),
  validate(unitStatusSchema),
  unitController.updateStatus,
);

export default router;
