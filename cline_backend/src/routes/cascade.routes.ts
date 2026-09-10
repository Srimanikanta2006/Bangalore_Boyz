import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import * as cascadeController from '../controllers/cascade.controller';

const router = Router();

/** GET /api/zones/:zoneId/cascade - Zone Detail cascade analysis. */
router.get('/zones/:zoneId/cascade', authenticate, cascadeController.zoneCascade);

export default router;
