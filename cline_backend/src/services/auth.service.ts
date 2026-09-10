import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../db/prisma';
import { AppError, Errors } from '../utils/errors';
import type { JwtPayload, SafeUser } from '../types/auth';
import { recordAudit, AuditActions } from './audit.service';

interface UserWithDepartment {
  id: string;
  name: string;
  email: string;
  role: SafeUser['role'];
  departmentId: string | null;
  department: { name: string } | null;
  phone: string | null;
  isActive: boolean;
  createdAt: Date;
}

function toSafeUser(user: UserWithDepartment): SafeUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
    departmentName: user.department?.name ?? null,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    include: { department: { select: { name: true } } },
  });

  if (!user) {
    await recordAudit({ action: AuditActions.AUTH_LOGIN_FAILED, metadata: { email, reason: 'UNKNOWN_EMAIL' } });
    throw Errors.invalidCredentials();
  }
  if (!user.isActive) {
    throw new AppError('ACCOUNT_DISABLED', 'This account has been disabled. Contact an administrator.', 403);
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    await recordAudit({
      userId: user.id,
      action: AuditActions.AUTH_LOGIN_FAILED,
      entityType: 'USER',
      entityId: user.id,
      metadata: { email, reason: 'BAD_PASSWORD' },
    });
    throw Errors.invalidCredentials();
  }

  const payload: JwtPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    departmentId: user.departmentId,
  };
  const token = jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });

  await recordAudit({
    userId: user.id,
    action: AuditActions.AUTH_LOGIN,
    entityType: 'USER',
    entityId: user.id,
    metadata: { role: user.role },
  });

  return {
    user: toSafeUser(user),
    token,
    tokenType: 'Bearer',
    expiresIn: env.JWT_EXPIRES_IN,
  };
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { department: { select: { name: true } } },
  });
  if (!user) throw Errors.notFound('User', userId);
  return toSafeUser(user);
}

/** Used by prisma/seed.ts - passwords are hashed, never stored in plaintext. */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
