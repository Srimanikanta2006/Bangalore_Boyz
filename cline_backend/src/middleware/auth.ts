import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import type { Role } from '@prisma/client';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { Errors } from '../utils/errors';
import type { AuthUser, JwtPayload } from '../types/auth';

function extractToken(req: Request): string | null {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7).trim();
  return null;
}

/**
 * JWT authentication middleware. Re-checks the user against the database so
 * disabled/deleted accounts lose access immediately (token revocation by flag).
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) throw Errors.unauthenticated('Missing Bearer token');

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    } catch {
      throw Errors.invalidToken();
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, departmentId: true, isActive: true },
    });
    if (!user || !user.isActive) {
      throw Errors.invalidToken('User account is disabled or no longer exists');
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      departmentId: user.departmentId,
    };
    req.user = authUser;
    next();
  } catch (err) {
    next(err);
  }
}

/**
 * Role-based authorization. Roles are ALWAYS resolved server-side from the
 * verified JWT/database - never trusted from the request body.
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(Errors.unauthenticated());
    if (!roles.includes(req.user.role)) {
      return next(Errors.forbidden(`This action requires one of roles: ${roles.join(' | ')}`));
    }
    next();
  };
}

/**
 * Explicitly denies CITIZEN accounts on internal/government read endpoints.
 * Government write endpoints are already fail-closed (their requireRole lists
 * never include CITIZEN); this guard additionally hides internal READ data
 * (incidents, tasks, units, audit, deployments, telemetry internals) from
 * authenticated citizens. Must run AFTER `authenticate`.
 */
export function denyCitizen(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role === 'CITIZEN') {
    return next(Errors.forbidden('This resource is not available to citizen accounts.'));
  }
  next();
}

/**
 * Internal path prefixes a CITIZEN account must never read. Government staff
 * roles are unaffected. Citizen-safe public data (hazards, zones, hotspots,
 * infrastructure, map assets/hazards/incidents, weather, location) is NOT listed.
 */
const CITIZEN_DENIED_PREFIXES = [
  '/api/government',
  '/api/overview',
  '/api/response-center',
  '/api/incidents',
  '/api/tasks',
  '/api/units',
  '/api/audit',
  '/api/analytics',
  '/api/simulations',
  '/api/departments',
  '/api/cascade',
  '/api/map/overlays',
  '/api/map/units',
];

function isInternalPath(pathname: string): boolean {
  return CITIZEN_DENIED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * App-level guard mounted once (before the route stack). For internal path
 * prefixes only, it inspects the Bearer token purely to detect CITIZEN accounts
 * and blocks them with 403. It never sets req.user and never changes behavior
 * for missing/invalid tokens (the per-route `authenticate` still runs and owns
 * the 401 path) or for non-citizen roles.
 */
export function blockCitizenFromInternal(req: Request, _res: Response, next: NextFunction): void {
  const pathname = req.originalUrl.split('?')[0];
  if (!isInternalPath(pathname)) return next();

  const token = extractToken(req);
  if (!token) return next();
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
    if (payload.role === 'CITIZEN') {
      return next(Errors.forbidden('This resource is not available to citizen accounts.'));
    }
  } catch {
    // Invalid token: defer to the per-route authenticate (returns 401).
  }
  next();
}
