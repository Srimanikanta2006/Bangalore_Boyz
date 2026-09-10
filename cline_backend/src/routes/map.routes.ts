import { Router } from 'express';
import { z } from 'zod';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import * as mapController from '../controllers/map.controller';

const router = Router();

const mapAssetQuery = z.object({
  zoneId: z.string().min(1).optional(),
  assetType: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
  criticality: z.string().min(1).optional(),
});
const mapHazardQuery = z.object({
  zoneId: z.string().min(1).optional(),
  severity: z.string().min(1).optional(),
  hazardType: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});
const mapIncidentQuery = z.object({
  zoneId: z.string().min(1).optional(),
  severity: z.string().min(1).optional(),
  status: z.string().min(1).optional(),
});
const mapUnitQuery = z.object({
  status: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
  departmentId: z.string().min(1).optional(),
});

router.get('/map/assets', authenticate, validate(mapAssetQuery, 'query'), mapController.assets);
router.get('/map/hazards', authenticate, validate(mapHazardQuery, 'query'), mapController.hazards);
router.get('/map/incidents', authenticate, validate(mapIncidentQuery, 'query'), mapController.incidents);
router.get('/map/units', authenticate, validate(mapUnitQuery, 'query'), mapController.units);
router.get('/map/overlays', authenticate, mapController.overlays);

export default router;
