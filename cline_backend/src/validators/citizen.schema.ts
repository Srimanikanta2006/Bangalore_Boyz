import { z } from 'zod';

export const citizenNearbyQuerySchema = z.object({
  latitude: z.coerce.number().min(-90, 'latitude must be within [-90, 90]').max(90, 'latitude must be within [-90, 90]'),
  longitude: z.coerce.number().min(-180, 'longitude must be within [-180, 180]').max(180, 'longitude must be within [-180, 180]'),
  radiusKm: z.coerce.number().min(0.5).max(25).default(5),
  limit: z.coerce.number().int().min(1).max(50).default(15),
});

export type CitizenNearbyQuery = z.infer<typeof citizenNearbyQuerySchema>;
