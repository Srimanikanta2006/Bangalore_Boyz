import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as overviewController from '../controllers/overview.controller';

const router = Router();

/** GET /api/government/overview - Overview dashboard metrics. */
router.get('/government/overview', authenticate, overviewController.getOverviewHandler);

export default router;
