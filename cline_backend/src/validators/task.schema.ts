import { z } from 'zod';
import { paginationQuerySchema } from '../utils/pagination';

const taskStatusEnum = z.enum(['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']);
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);

export const createTaskSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().max(4000).optional(),
  incidentId: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
  assignedUnitId: z.string().min(1).optional(),
  assignedDepartmentId: z.string().min(1).optional(),
  priority: priorityEnum.optional(),
  slaDeadline: z.coerce.date().optional(),
});

export const taskStatusSchema = z.object({
  status: taskStatusEnum,
  note: z.string().max(1000).optional(),
});

export const assignUnitSchema = z.object({
  unitId: z.string().min(1, 'unitId is required'),
});

export const verifyTaskSchema = z.object({
  note: z.string().max(1000).optional(),
});

export const taskQuerySchema = paginationQuerySchema.extend({
  status: taskStatusEnum.optional(),
  priority: priorityEnum.optional(),
  incidentId: z.string().min(1).optional(),
  assignedUnitId: z.string().min(1).optional(),
  assetId: z.string().min(1).optional(),
  assignedDepartmentId: z.string().min(1).optional(),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type TaskQuery = z.infer<typeof taskQuerySchema>;
