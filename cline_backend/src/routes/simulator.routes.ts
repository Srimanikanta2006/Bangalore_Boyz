import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createSimulationSchema, simulationQuerySchema } from '../validators/simulator.schema';
import * as simulatorController from '../controllers/simulator.controller';

const router = Router();

router.post(
  '/simulations',
  authenticate,
  requireRole('GOVERNMENT_OPERATOR', 'DISPATCHER', 'ADMIN', 'ANALYST'),
  validate(createSimulationSchema),
  simulatorController.create,
);
router.get('/simulations', authenticate, validate(simulationQuerySchema, 'query'), simulatorController.list);
router.get('/simulations/:id', authenticate, simulatorController.get);

export default router;
