import { Router } from 'express';
import { z } from 'zod';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { paginationQuerySchema } from '../utils/pagination';
import * as auditController from '../controllers/audit.controller';

const router = Router();

const auditQuerySchema = paginationQuerySchema.extend({
  action: z.string().min(1).optional(),
  entityType: z.string().min(1).optional(),
  entityId: z.string().min(1).optional(),
  userId: z.string().min(1).optional(),
});

/** GET /api/audit - operational audit trail (ADMIN + GOVERNMENT_OPERATOR). */
router.get(
  '/audit',
  authenticate,
  requireRole('ADMIN', 'GOVERNMENT_OPERATOR'),
  validate(auditQuerySchema, 'query'),
  auditController.list,
);

export default router;
