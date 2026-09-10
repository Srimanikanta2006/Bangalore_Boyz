/**
 * Pure, dependency-free retry/backoff decision logic for the notification
 * outbox (Chunk I — "alert delivery reliability"). Kept separate from any
 * I/O so the actual reliability mechanism (not a specific provider) is
 * fully unit-testable without a real network call or a fake provider key.
 */

export const MAX_DELIVERY_ATTEMPTS = 3;

export type DeliveryOutcome =
  | { kind: 'not_configured' }
  | { kind: 'success' }
  | { kind: 'error'; message: string };

export interface DeliveryDecision {
  deliveryStatus: 'NOT_CONFIGURED' | 'PENDING' | 'DELIVERED' | 'FAILED';
  attempts: number;
  lastDeliveryError: string | null;
  deliveredNow: boolean;
}

/**
 * Decides the next persisted delivery state given the current attempt count
 * and what happened on this attempt. Never marks DELIVERED unless the
 * outcome was a genuine `success` - this is the one rule that must never be
 * violated (never fake a "sent" status).
 */
export function decideNextDeliveryState(currentAttempts: number, outcome: DeliveryOutcome): DeliveryDecision {
  if (outcome.kind === 'not_configured') {
    return { deliveryStatus: 'NOT_CONFIGURED', attempts: currentAttempts + 1, lastDeliveryError: null, deliveredNow: false };
  }
  if (outcome.kind === 'success') {
    return { deliveryStatus: 'DELIVERED', attempts: currentAttempts + 1, lastDeliveryError: null, deliveredNow: true };
  }
  const attempts = currentAttempts + 1;
  const exhausted = attempts >= MAX_DELIVERY_ATTEMPTS;
  return {
    deliveryStatus: exhausted ? 'FAILED' : 'PENDING',
    attempts,
    lastDeliveryError: outcome.message,
    deliveredNow: false,
  };
}
