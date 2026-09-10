import { describe, expect, it } from 'vitest';
import { canTransition, INCIDENT_TRANSITIONS, TASK_TRANSITIONS, UNIT_TRANSITIONS } from '../../src/utils/state';

describe('backend-owned state machines', () => {
  it('enforces the task lifecycle ASSIGNED -> ACKNOWLEDGED -> IN_PROGRESS -> COMPLETED', () => {
    expect(canTransition(TASK_TRANSITIONS, 'ASSIGNED', 'ACKNOWLEDGED')).toBe(true);
    expect(canTransition(TASK_TRANSITIONS, 'ACKNOWLEDGED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition(TASK_TRANSITIONS, 'IN_PROGRESS', 'COMPLETED')).toBe(true);
  });

  it('allows CANCELLED from any non-cancelled status but nothing from CANCELLED', () => {
    for (const from of ['ASSIGNED', 'ACKNOWLEDGED', 'IN_PROGRESS', 'COMPLETED'] as const) {
      expect(canTransition(TASK_TRANSITIONS, from, 'CANCELLED')).toBe(true);
    }
    expect(TASK_TRANSITIONS.CANCELLED).toEqual([]);
  });

  it('rejects task status skips (ASSIGNED -> COMPLETED/IN_PROGRESS)', () => {
    expect(canTransition(TASK_TRANSITIONS, 'ASSIGNED', 'COMPLETED')).toBe(false);
    expect(canTransition(TASK_TRANSITIONS, 'ASSIGNED', 'IN_PROGRESS')).toBe(false);
    expect(canTransition(TASK_TRANSITIONS, 'COMPLETED', 'IN_PROGRESS')).toBe(false);
  });

  it('enforces the incident lifecycle', () => {
    expect(canTransition(INCIDENT_TRANSITIONS, 'NEW', 'ACKNOWLEDGED')).toBe(true);
    expect(canTransition(INCIDENT_TRANSITIONS, 'ACKNOWLEDGED', 'IN_PROGRESS')).toBe(true);
    expect(canTransition(INCIDENT_TRANSITIONS, 'IN_PROGRESS', 'RESOLVED')).toBe(true);
    expect(canTransition(INCIDENT_TRANSITIONS, 'RESOLVED', 'CLOSED')).toBe(true);
    expect(canTransition(INCIDENT_TRANSITIONS, 'NEW', 'RESOLVED')).toBe(false);
    expect(canTransition(INCIDENT_TRANSITIONS, 'CLOSED', 'NEW')).toBe(false);
  });

  it('enforces unit status transitions', () => {
    expect(canTransition(UNIT_TRANSITIONS, 'AVAILABLE', 'ASSIGNED')).toBe(true);
    expect(canTransition(UNIT_TRANSITIONS, 'OFFLINE', 'AVAILABLE')).toBe(true);
    expect(canTransition(UNIT_TRANSITIONS, 'ON_SCENE', 'EN_ROUTE')).toBe(false);
  });
});
