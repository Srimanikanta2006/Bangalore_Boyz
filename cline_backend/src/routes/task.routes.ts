import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { GOVERNMENT_ROLES } from '../types/auth';
import { assignUnitSchema, createTaskSchema, taskQuerySchema, taskStatusSchema, verifyTaskSchema } from '../validators/task.schema';
import * as taskController from '../controllers/task.controller';

const router = Router();

router.get('/tasks', authenticate, validate(taskQuerySchema, 'query'), taskController.list);
router.post('/tasks', authenticate, requireRole(...GOVERNMENT_ROLES), validate(createTaskSchema), taskController.create);
router.get('/tasks/:id', authenticate, taskController.get);
router.patch(
  '/tasks/:id/status',
  authenticate,
  requireRole('FIELD_OPERATOR', 'DISPATCHER', 'GOVERNMENT_OPERATOR', 'ADMIN'),
  validate(taskStatusSchema),
  taskController.updateStatus,
);
router.post('/tasks/:id/assign', authenticate, requireRole(...GOVERNMENT_ROLES), validate(assignUnitSchema), taskController.assign);
router.post('/tasks/:id/verify', authenticate, requireRole(...GOVERNMENT_ROLES), validate(verifyTaskSchema), taskController.verify);
router.get('/tasks/:id/history', authenticate, taskController.history);

export default router;
