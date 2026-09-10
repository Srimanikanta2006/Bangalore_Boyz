import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as departmentController from '../controllers/department.controller';

const router = Router();

const departmentQuerySchema = paginationQuerySchema.extend({
  type: z.enum(['PUBLIC_WORKS', 'FIRE_RESCUE', 'EMS', 'POLICE', 'UTILITIES', 'WATER', 'TRANSPORT', 'EMERGENCY_MANAGEMENT']).optional(),
});

const departmentUnitsQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['AVAILABLE', 'ASSIGNED', 'EN_ROUTE', 'ON_SCENE', 'BUSY', 'OFFLINE']).optional(),
});

router.get('/departments', authenticate, validate(departmentQuerySchema, 'query'), departmentController.list);
router.get('/departments/:id', authenticate, departmentController.get);
router.get('/departments/:id/units', authenticate, validate(departmentUnitsQuerySchema, 'query'), departmentController.units);
router.get('/departments/:id/readiness', authenticate, departmentController.readiness);

export default router;
