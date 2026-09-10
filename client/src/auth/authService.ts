import { api } from '../lib/api';
import type { AuthUser, LoginResult } from './types';

/** POST /api/auth/login — exchange credentials for a JWT + user profile. */
export function login(email: string, password: string): Promise<LoginResult> {
  return api.post<LoginResult>('/auth/login', { email, password }, { anonymous: true });
}

/** GET /api/auth/me — resolve the current user from a stored token. */
export function fetchMe(): Promise<AuthUser> {
  return api.get<{ user: AuthUser }>('/auth/me').then((d) => d.user);
}
