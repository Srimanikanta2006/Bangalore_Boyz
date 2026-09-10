import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

const assetTypeEnum = z.enum([
  'HOSPITAL', 'SUBSTATION', 'PUMPING_STATION', 'ROAD', 'BRIDGE', 'EVACUATION_SHELTER',
  'COOLING_CENTER', 'DRAIN', 'WATER_TREATMENT', 'GENERATOR', 'FIRE_STATION', 'AMBULANCE_GATE', 'OTHER',
]);
const operationalStatusEnum = z.enum(['OPERATIONAL', 'DEGRADED', 'AT_RISK', 'COMPROMISED', 'OFFLINE']);
const criticalityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const infrastructureQuerySchema = paginationQuerySchema.extend({
  facilityType: assetTypeEnum.optional(),
  zoneId: z.string().min(1).optional(),
  vulnerability: z.coerce.number().int().min(0).max(100).optional(),
  status: operationalStatusEnum.optional(),
  criticality: criticalityEnum.optional(),
  search: z.string().max(200).optional(),
});

export const assignTeamSchema = z.object({
  unitId: z.string().min(1).optional(),
  note: z.string().max(1000).optional(),
});

export const maintenanceSchema = z.object({
  description: z.string().max(2000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const rerouteSchema = z.object({
  reason: z.string().max(1000).optional(),
});

export const telemetryQuerySchema = z.object({
  metric: z.string().max(50).optional(),
  limit: z.coerce.number().int().min(1).max(200).default(50),
});

export type InfrastructureQuery = z.infer<typeof infrastructureQuerySchema>;
