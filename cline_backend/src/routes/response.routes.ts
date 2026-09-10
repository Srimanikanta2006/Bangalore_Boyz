import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { GOVERNMENT_ROLES } from '../types/auth';
import * as responseController from '../controllers/response.controller';

const router = Router();

/** GET /api/response-center - Response Center dispatch board. */
router.get('/response-center', authenticate, responseController.getResponseCenterHandler);

/** POST /api/zones/:zoneId/response-plan - deterministic PROPOSED plan (not executed). */
router.post('/zones/:zoneId/response-plan', authenticate, requireRole(...GOVERNMENT_ROLES), responseController.createResponsePlanHandler);

export default router;
