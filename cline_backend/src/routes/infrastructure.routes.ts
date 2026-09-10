import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { GOVERNMENT_ROLES } from '../types/auth';
import {
  assignTeamSchema,
  infrastructureQuerySchema,
  maintenanceSchema,
  rerouteSchema,
  telemetryQuerySchema,
} from '../validators/infrastructure.schema';
import * as infrastructureController from '../controllers/infrastructure.controller';

const router = Router();

router.get('/infrastructure', authenticate, validate(infrastructureQuerySchema, 'query'), infrastructureController.list);
router.get('/infrastructure/:id', authenticate, infrastructureController.get);
router.get('/infrastructure/:id/telemetry', authenticate, validate(telemetryQuerySchema, 'query'), infrastructureController.telemetry);
router.get('/infrastructure/:id/risk', authenticate, infrastructureController.risk);
router.get('/infrastructure/:id/dependencies', authenticate, infrastructureController.dependencies);
router.get('/infrastructure/:id/logs', authenticate, infrastructureController.logs);
router.post('/infrastructure/:id/assign-team', authenticate, requireRole(...GOVERNMENT_ROLES), validate(assignTeamSchema), infrastructureController.assignTeam);
router.post('/infrastructure/:id/maintenance', authenticate, requireRole(...GOVERNMENT_ROLES), validate(maintenanceSchema), infrastructureController.maintenance);
router.post('/infrastructure/:id/reroute', authenticate, requireRole(...GOVERNMENT_ROLES), validate(rerouteSchema), infrastructureController.reroute);

export default router;
