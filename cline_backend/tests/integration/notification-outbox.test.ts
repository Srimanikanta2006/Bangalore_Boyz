import { describe, expect, it } from 'vitest';
import { dbReady } from '../helpers';
import { prisma } from '../../src/db/prisma';
import { attemptNotificationDelivery } from '../../src/notifications/delivery.service';

const ready = await dbReady();

describe.skipIf(!ready)('notification outbox (Chunk I — real DB effects, no fabricated delivery)', () => {
  it('a fresh notification defaults to NOT_CONFIGURED (no external channel wired) until an attempt runs', async () => {
    const user = await prisma.user.findFirst({ where: { role: 'GOVERNMENT_OPERATOR' } });
    expect(user).not.toBeNull();

    const notification = await prisma.notification.create({
      data: { userId: user!.id, type: 'TEST', title: 't', message: 'm' },
    });
    try {
      expect(notification.deliveryStatus).toBe('NOT_CONFIGURED');
      expect(notification.deliveryAttempts).toBe(0);
      expect(notification.deliveredAt).toBeNull();

      await attemptNotificationDelivery(notification.id);

      const after = await prisma.notification.findUnique({ where: { id: notification.id } });
      expect(after!.deliveryStatus).toBe('NOT_CONFIGURED');
      expect(after!.deliveryAttempts).toBe(1);
      expect(after!.lastAttemptAt).not.toBeNull();
      expect(after!.deliveredAt).toBeNull(); // never fake a "sent" status
    } finally {
      await prisma.notification.delete({ where: { id: notification.id } });
    }
  });

  it('is a no-op for an unknown notification id (never throws)', async () => {
    await expect(attemptNotificationDelivery('does-not-exist')).resolves.toBeUndefined();
  });
});
