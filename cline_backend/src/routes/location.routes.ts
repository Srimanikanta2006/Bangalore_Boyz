import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { locationQuerySchema } from '../validators/location.schema';
import { overview } from '../controllers/location.controller';

const router = Router();

/** GET /api/location/overview?latitude=&longitude=&radiusKm=&assetLimit= - live weather + zone + nearby real assets + modeled risk/cascade. */
router.get('/location/overview', authenticate, validate(locationQuerySchema, 'query'), overview);

export default router;
