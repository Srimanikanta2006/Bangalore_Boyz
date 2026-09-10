import { z } from 'zod';

const routePointSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
});

const candidateRouteSchema = z.object({
  label: z.string().max(80).optional(),
  distanceMeters: z.coerce.number().min(0).max(500_000).optional(),
  durationSeconds: z.coerce.number().min(0).max(86_400).optional(),
  points: z.array(routePointSchema).min(2).max(300),
});

export const scoreRoutesSchema = z.object({
  routes: z.array(candidateRouteSchema).min(1).max(5),
});

export type ScoreRoutesInput = z.infer<typeof scoreRoutesSchema>;
