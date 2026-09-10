import { z } from 'zod';

/** POST /api/incidents/:incidentId/dispatch */
export const dispatchSchema = z.object({
  unitId: z.string().min(1, 'unitId is required'),
});

export type DispatchInput = z.infer<typeof dispatchSchema>;
