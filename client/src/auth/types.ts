/** Roles as defined by the backend Prisma `Role` enum. */
export type Role =
  | 'ADMIN'
  | 'GOVERNMENT_OPERATOR'
  | 'DISPATCHER'
  | 'FIELD_OPERATOR'
  | 'ANALYST'
  | 'CITIZEN';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  departmentId: string | null;
  departmentName: string | null;
  phone: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LoginResult {
  user: AuthUser;
  token: string;
  tokenType: string;
  expiresIn: string;
}

/** Landing route for each role after a successful login. */
export const ROLE_HOME: Record<Role, string> = {
  CITIZEN: '/citizen/map',
  GOVERNMENT_OPERATOR: '/gov/overview',
  DISPATCHER: '/gov/overview',
  ADMIN: '/gov/overview',
  ANALYST: '/gov/overview',
  FIELD_OPERATOR: '/gov/mobile/map',
};

export function homeForRole(role: Role): string {
  return ROLE_HOME[role] ?? '/login';
}

/** Government HQ desktop console roles (dashboards; write actions are further gated server-side per-endpoint). */
export const GOV_HQ_ROLES: Role[] = ['ADMIN', 'GOVERNMENT_OPERATOR', 'DISPATCHER', 'ANALYST'];

/**
 * Field-crew role. This is the SAME backend role for both the "Government
 * Mobile / Field" and "Rescue Team" login personas — there is no separate
 * RESCUE role in the schema (see docs/MASTER_PLAN.md §1). Which pages a
 * FIELD_OPERATOR lands on/uses is a frontend routing choice, not a permission
 * difference, so this one role list guards both route groups.
 */
export const FIELD_ROLES: Role[] = ['FIELD_OPERATOR'];
