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
