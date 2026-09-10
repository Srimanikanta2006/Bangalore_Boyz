import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { GOVERNMENT_ROLES } from '../types/auth';
import {
  createIncidentSchema,
  incidentQuerySchema,
  incidentStatusSchema,
  updateIncidentSchema,
} from '../validators/incident.schema';
import { dispatchSchema } from '../validators/response.schema';
import * as incidentController from '../controllers/incident.controller';

const router = Router();

router.get('/incidents', authenticate, validate(incidentQuerySchema, 'query'), incidentController.list);
router.post(
  '/incidents',
  authenticate,
  requireRole(...GOVERNMENT_ROLES),
  validate(createIncidentSchema),
  incidentController.create,
);
router.get('/incidents/:id', authenticate, incidentController.get);
router.get('/incidents/:id/cascade', authenticate, incidentController.getCascade);
router.patch(
  '/incidents/:id',
  authenticate,
  requireRole(...GOVERNMENT_ROLES),
  validate(updateIncidentSchema),
  incidentController.update,
);
router.patch(
  '/incidents/:id/status',
  authenticate,
  requireRole(...GOVERNMENT_ROLES),
  validate(incidentStatusSchema),
  incidentController.updateStatus,
);
router.post(
  '/incidents/:incidentId/dispatch',
  authenticate,
  requireRole(...GOVERNMENT_ROLES),
  validate(dispatchSchema),
  incidentController.dispatch,
);

export default router;
