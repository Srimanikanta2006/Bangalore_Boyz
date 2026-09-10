import { describe, expect, it } from 'vitest';
import { decideNextDeliveryState, MAX_DELIVERY_ATTEMPTS } from '../../src/notifications/deliveryPolicy';
import { resolveChannel } from '../../src/notifications/delivery.service';

describe('resolveChannel (honest, no fabricated provider)', () => {
  it('returns null - no external SMS/push provider is configured (never fake a "sent" status)', () => {
    expect(resolveChannel()).toBeNull();
  });
});

describe('decideNextDeliveryState (real retry/backoff policy, provider-agnostic)', () => {
  it('marks NOT_CONFIGURED (never DELIVERED) when no channel is available', () => {
    const decision = decideNextDeliveryState(0, { kind: 'not_configured' });
    expect(decision.deliveryStatus).toBe('NOT_CONFIGURED');
    expect(decision.deliveredNow).toBe(false);
  });

  it('marks DELIVERED only on a genuine success outcome', () => {
    const decision = decideNextDeliveryState(0, { kind: 'success' });
    expect(decision.deliveryStatus).toBe('DELIVERED');
    expect(decision.deliveredNow).toBe(true);
  });

  it('retries (PENDING) on a transient error, below the attempt ceiling', () => {
    const decision = decideNextDeliveryState(0, { kind: 'error', message: 'timeout' });
    expect(decision.deliveryStatus).toBe('PENDING');
    expect(decision.attempts).toBe(1);
    expect(decision.lastDeliveryError).toBe('timeout');
  });

  it('gives up (FAILED) once MAX_DELIVERY_ATTEMPTS is reached - never retries forever', () => {
    const decision = decideNextDeliveryState(MAX_DELIVERY_ATTEMPTS - 1, { kind: 'error', message: 'still failing' });
    expect(decision.deliveryStatus).toBe('FAILED');
    expect(decision.attempts).toBe(MAX_DELIVERY_ATTEMPTS);
  });

  it('a channel that fails twice then succeeds ends in DELIVERED (simulates real transient-failure recovery)', () => {
    let state = decideNextDeliveryState(0, { kind: 'error', message: 'network blip' });
    expect(state.deliveryStatus).toBe('PENDING');
    state = decideNextDeliveryState(state.attempts, { kind: 'error', message: 'network blip 2' });
    expect(state.deliveryStatus).toBe('PENDING');
    state = decideNextDeliveryState(state.attempts, { kind: 'success' });
    expect(state.deliveryStatus).toBe('DELIVERED');
    expect(state.attempts).toBe(3);
  });
});
