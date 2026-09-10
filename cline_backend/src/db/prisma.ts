import { PrismaClient } from '@prisma/client';
import { env } from '../config/env';

/**
 * Shared PrismaClient singleton.
 * Runtime queries and migrations use the local Docker Postgres URLs from .env.
 * DIRECT_URL remains separate so migration tooling can be configured independently.
 */
export const prisma = new PrismaClient({
  log: env.isDev ? ['warn', 'error'] : ['error'],
});

/** Prisma transaction client type (subset of PrismaClient). */
export type PrismaTx = Parameters<Parameters<PrismaClient['$transaction']>[0]>[0];
export type DbClient = PrismaClient | PrismaTx;

/** Verifies real database connectivity (used by /api/health). */
export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
