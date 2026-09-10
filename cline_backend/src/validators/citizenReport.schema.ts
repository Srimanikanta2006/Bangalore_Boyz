import { z } from 'zod';

/** multipart/form-data fields arrive as strings; coerce numerics accordingly. */
export const createCitizenReportSchema = z.object({
  category: z.enum([
    'FLASH_FLOOD',
    'ROAD_BLOCKED',
    'DOWNED_LINE',
    'EXTREME_HEAT',
    'WATER_MAIN',
    'LANDSLIDE_MUD',
    'STORM_DAMAGE',
    'OTHER',
  ]),
  description: z.string().max(2000).optional(),
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  reportedSeverity: z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']).optional(),
});

export type CreateCitizenReportInput = z.infer<typeof createCitizenReportSchema>;
