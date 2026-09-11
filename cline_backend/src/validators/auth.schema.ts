import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('A valid email address is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z
    .enum(['ADMIN', 'GOVERNMENT_OPERATOR', 'DISPATCHER', 'FIELD_OPERATOR', 'ANALYST', 'CITIZEN'])
    .optional()
    .default('CITIZEN'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
