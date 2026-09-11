import type { OutboxEventType } from '@prisma/client';
import type { DbClient } from '../db/prisma';
import { prisma } from '../db/prisma';

export async function createOutboxEvent(
  tx: DbClient,
  params: { eventType: OutboxEventType; payload: object; idempotencyKey?: string; traceId?: string; requestId?: string },
) {
  if (params.idempotencyKey) {
    const existing = await tx.eventOutbox.findUnique({ where: { idempotencyKey: params.idempotencyKey } });
    if (existing) return existing;
  }
  return tx.eventOutbox.create({
    data: {
      eventType: params.eventType,
      payload: params.payload,
      idempotencyKey: params.idempotencyKey,
      traceId: params.traceId,
      requestId: params.requestId,
    },
  });
}

export async function listOutboxEvents(status?: string) {
  return prisma.eventOutbox.findMany({
    where: status ? { status: status as never } : undefined,
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
}
