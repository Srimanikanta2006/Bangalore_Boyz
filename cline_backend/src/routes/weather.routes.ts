import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { weatherHistoryQuerySchema, weatherQuerySchema } from '../validators/weather.schema';
import * as weatherController from '../controllers/weather.controller';

const router = Router();

/** GET /api/weather/current?latitude=&longitude=&forecastHours= - live provider data (cached briefly). */
router.get('/weather/current', authenticate, validate(weatherQuerySchema, 'query'), weatherController.current);

/** GET /api/weather/history?zoneId=&page=&limit= - persisted background-poll snapshots. */
router.get('/weather/history', authenticate, validate(weatherHistoryQuerySchema, 'query'), weatherController.history);

export default router;
