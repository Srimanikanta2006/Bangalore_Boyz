import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as analyticsController from '../controllers/analytics.controller';

const router = Router();

/** GET /api/analytics/overview - cross-cutting analytics aggregates. */
router.get('/analytics/overview', authenticate, analyticsController.overview);

/** GET /api/analytics/disaster-intelligence - static, cited regional reference (Cyclone Hudhud). */
router.get('/analytics/disaster-intelligence', authenticate, analyticsController.disasterIntelligence);

export default router;
