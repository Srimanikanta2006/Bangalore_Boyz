import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { evidenceUpload } from '../middleware/upload';
import { CITIZEN_ROLES } from '../types/auth';
import { citizenNearbyQuerySchema } from '../validators/citizen.schema';
import { createCitizenReportSchema } from '../validators/citizenReport.schema';
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

/**
 * GET /api/citizen/hazards/:id
 * Composed hazard detail: raw measurements for this hazard + deterministic
 * risk score, impacted roads/facilities and recommended actions from the
 * (unmodified) cascade engine for its zone. CITIZEN-only.
 */
router.get('/citizen/hazards/:id', authenticate, requireRole(...CITIZEN_ROLES), citizenController.hazardDetail);

/**
 * POST /api/citizen/reports (multipart/form-data: category, description?,
 * latitude, longitude, reportedSeverity?, up to 3 files field "evidence")
 * Creates a CitizenReport + auto-linked Incident (NEW) for operator triage.
 */
router.post(
  '/citizen/reports',
  authenticate,
  requireRole(...CITIZEN_ROLES),
  evidenceUpload,
  validate(createCitizenReportSchema, 'body'),
  citizenController.submitReport,
);

/** GET /api/citizen/reports - own report history only. */
router.get('/citizen/reports', authenticate, requireRole(...CITIZEN_ROLES), citizenController.myReports);

/** GET /api/citizen/reports/:id - own report detail + evidence (404 on foreign id). */
router.get('/citizen/reports/:id', authenticate, requireRole(...CITIZEN_ROLES), citizenController.myReportDetail);

export default router;
