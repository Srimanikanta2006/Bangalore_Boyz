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
