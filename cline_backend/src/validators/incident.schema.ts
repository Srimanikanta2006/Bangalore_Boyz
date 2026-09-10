import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

const incidentTypeEnum = z.enum([
  'FLOODING', 'INFRASTRUCTURE_FAILURE', 'POWER_FAILURE', 'ROAD_BLOCKAGE',
  'HEAT_EMERGENCY', 'DRAINAGE_FAILURE', 'MEDICAL_ACCESS', 'EVACUATION', 'OTHER',
]);
const severityEnum = z.enum(['LOW', 'MODERATE', 'HIGH', 'CRITICAL']);
const incidentStatusEnum = z.enum(['NEW', 'ACKNOWLEDGED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED']);

export const createIncidentSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  type: incidentTypeEnum,
  severity: severityEnum,
  zoneId: z.string().min(1),
  hazardId: z.string().min(1).optional(),
  primaryAssetId: z.string().min(1).optional(),
  reportedAt: z.coerce.date().optional(),
  slaDeadline: z.coerce.date().optional(),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(4000).optional(),
  severity: severityEnum.optional(),
  primaryAssetId: z.string().min(1).nullable().optional(),
  hazardId: z.string().min(1).nullable().optional(),
});

export const incidentStatusSchema = z.object({
  status: incidentStatusEnum,
  note: z.string().max(1000).optional(),
});

export const incidentQuerySchema = paginationQuerySchema.extend({
  severity: severityEnum.optional(),
  status: incidentStatusEnum.optional(),
  type: incidentTypeEnum.optional(),
  zoneId: z.string().min(1).optional(),
  hazardId: z.string().min(1).optional(),
  search: z.string().max(200).optional(),
});

export type CreateIncidentInput = z.infer<typeof createIncidentSchema>;
export type UpdateIncidentInput = z.infer<typeof updateIncidentSchema>;
export type IncidentQuery = z.infer<typeof incidentQuerySchema>;
