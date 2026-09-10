import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { CITIZEN_ROLES } from '../types/auth';
import { citizenNearbyQuerySchema } from '../validators/citizen.schema';
import * as citizenController from '../controllers/citizen.controller';

const router = Router();

/**
 * GET /api/citizen/nearby?latitude=&longitude=&radiusKm=&limit=
 * Sanitized public-safety snapshot for a point: containing ward, live weather +
 * air quality, active hazards, nearby shelters/hospitals/roads, computed safety
 * index and corridor status. CITIZEN-only.
 */
router.get(
  '/citizen/nearby',
  authenticate,
  requireRole(...CITIZEN_ROLES),
  validate(citizenNearbyQuerySchema, 'query'),
  citizenController.nearby,
);

/**
 * GET /api/citizen/alerts?latitude=&longitude=&radiusKm=
 * Computed nearby advisories (flood/heat/storm/corridor) from live hazards,
 * modeled weather severity and road closures. CITIZEN-only.
 */
router.get(
  '/citizen/alerts',
  authenticate,
  requireRole(...CITIZEN_ROLES),
  validate(citizenNearbyQuerySchema, 'query'),
  citizenController.alerts,
);

export default router;
