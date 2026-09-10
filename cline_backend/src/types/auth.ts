import type { Role } from '@prisma/client';

/** Authenticated request user (attached by the authenticate middleware). */
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  departmentId: string | null;
}

/** User representation safe to return from APIs (never includes passwordHash). */
export interface SafeUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  departmentName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const GOVERNMENT_ROLES: Role[] = ['GOVERNMENT_OPERATOR', 'DISPATCHER', 'ADMIN'];
export const ALL_ROLES: Role[] = ['ADMIN', 'GOVERNMENT_OPERATOR', 'DISPATCHER', 'FIELD_OPERATOR', 'ANALYST'];
