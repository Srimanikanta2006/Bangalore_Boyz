import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

const scenarioTypeEnum = z.enum(['ATMOSPHERIC_RIVER', 'FLASH_FLOOD', 'EXTREME_HEAT', 'STORM', 'CUSTOM']);

/** POST /api/simulations - deterministic scenario parameters. */
export const createSimulationSchema = z.object({
  name: z.string().min(3).max(150).optional(),
  scenarioType: scenarioTypeEnum,
  rainfallRate: z.coerce.number().min(0).max(300).optional(), // mm/hr
  stormDuration: z.coerce.number().min(0).max(168).optional(), // hours
  drainageThroughput: z.coerce.number().min(0).max(100).optional(), // %
  tidalSurge: z.coerce.number().min(0).max(10).optional(), // m
  temperature: z.coerce.number().min(-20).max(60).optional(), // °C
  zoneId: z.string().min(1).optional(), // restrict simulation to one zone
}).refine(
  (data) =>
    data.rainfallRate !== undefined ||
    data.temperature !== undefined ||
    data.stormDuration !== undefined ||
    data.tidalSurge !== undefined,
  { message: 'Provide at least one scenario parameter (rainfallRate, temperature, stormDuration or tidalSurge)' },
);

export const simulationQuerySchema = paginationQuerySchema.extend({
  scenarioType: scenarioTypeEnum.optional(),
  status: z.enum(['PENDING', 'RUNNING', 'COMPLETED', 'FAILED']).optional(),
});

export type CreateSimulationInput = z.infer<typeof createSimulationSchema>;
export type SimulationQuery = z.infer<typeof simulationQuerySchema>;
