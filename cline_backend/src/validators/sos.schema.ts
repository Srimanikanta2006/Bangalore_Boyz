import { z } from 'zod';

export const createSosSchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  primaryThreat: z.enum(['MEDICAL', 'FIRE_RESCUE', 'FLOOD_BOAT', 'HAZARD_GAS']),
  peopleAffected: z.coerce.number().int().min(1).max(100).optional(),
  note: z.string().max(1000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
});

export type CreateSosInput = z.infer<typeof createSosSchema>;
