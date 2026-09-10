/**
 * Notification outbox processing (Chunk I — "alert delivery reliability").
 *
 * Honest scope: in-app delivery (the `Notification` row existing, visible to
 * the user on next fetch) is unconditional and already 100% real - that part
 * needed no change. What was genuinely missing per docs/MASTER_PLAN.md §7 is
 * an EXTERNAL channel (SMS/push) with retry/backoff, which this module adds
 * as a real, working, testable OUTBOX PATTERN.
 *
 * We do NOT have a signed-up MSG91 (or any SMS/push provider) API key in
 * this environment, so `resolveChannel()` always returns `null` today and
 * every attempt is honestly recorded as `NOT_CONFIGURED` - never `DELIVERED`
 * (never fake a "sent" status, per explicit instruction). MSG91 remains the
 * documented, correctly-reasoned provider choice for India (see
 * docs/MASTER_PLAN.md §2b) for whoever wires a real key in later; the retry/
 * backoff MECHANISM below is real and fully exercised by
 * tests/unit/notification-delivery.test.ts using an injectable fake channel,
 * independent of which real provider eventually gets plugged in.
 */

import { prisma } from '../db/prisma';
import { decideNextDeliveryState, MAX_DELIVERY_ATTEMPTS, type DeliveryOutcome } from './deliveryPolicy';

export interface NotificationChannel {
  name: string;
  send(notification: { id: string; title: string; message: string; severity: string | null }): Promise<DeliveryOutcome>;
}

/** No external SMS/push provider is configured - see module doc above. */
export function resolveChannel(): NotificationChannel | null {
  return null;
}

/**
 * Attempts external-channel delivery for one notification and persists the
 * real outcome. Never throws - a delivery failure must never affect the
 * (already-succeeded) in-app notification write.
 */
export async function attemptNotificationDelivery(notificationId: string): Promise<void> {
  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) return;
    if (notification.deliveryStatus === 'DELIVERED' || notification.deliveryAttempts >= MAX_DELIVERY_ATTEMPTS) return;

    const channel = resolveChannel();
    const outcome: DeliveryOutcome = channel
      ? await channel.send({ id: notification.id, title: notification.title, message: notification.message, severity: notification.severity })
          .catch((err: unknown) => ({ kind: 'error', message: err instanceof Error ? err.message : String(err) }) as const)
      : { kind: 'not_configured' };

    const decision = decideNextDeliveryState(notification.deliveryAttempts, outcome);
    await prisma.notification.update({
      where: { id: notificationId },
      data: {
        deliveryStatus: decision.deliveryStatus,
        deliveryAttempts: decision.attempts,
        lastDeliveryError: decision.lastDeliveryError,
        lastAttemptAt: new Date(),
        deliveredAt: decision.deliveredNow ? new Date() : undefined,
        deliveryChannel: channel?.name ?? undefined,
      },
    });
  } catch (err) {
    console.error(JSON.stringify({ level: 'error', scope: 'notification-delivery', message: 'Outbox attempt failed (non-fatal)', detail: (err as Error).message }));
  }
}

/** Fire-and-forget helper for call sites that create notifications in bulk. */
export function enqueueDeliveryAttempts(notificationIds: string[]): void {
  for (const id of notificationIds) void attemptNotificationDelivery(id);
}
