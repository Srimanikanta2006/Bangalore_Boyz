import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

export const weatherQuerySchema = z.object({
  latitude: z.coerce.number().min(-90, 'latitude must be within [-90, 90]').max(90, 'latitude must be within [-90, 90]'),
  longitude: z.coerce.number().min(-180, 'longitude must be within [-180, 180]').max(180, 'longitude must be within [-180, 180]'),
  forecastHours: z.coerce.number().int().min(0).max(24).default(0),
});

export const weatherHistoryQuerySchema = paginationQuerySchema.extend({
  zoneId: z.string().min(1).optional(),
});

export type WeatherQuery = z.infer<typeof weatherQuerySchema>;
