import type { ResponseStatus } from '../types/domain';

const VALID_TRANSITIONS: Record<ResponseStatus, ResponseStatus[]> = {
  pending: ['assigned'],
  assigned: ['acknowledged'],
  acknowledged: ['in_progress'],
  in_progress: ['completed'],
  completed: [],
};

export function canTransition(from: ResponseStatus, to: ResponseStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

export function nextStatus(current: ResponseStatus): ResponseStatus | null {
  const transitions = VALID_TRANSITIONS[current];
  return transitions?.[0] ?? null;
}

export function statusLabel(status: ResponseStatus): string {
  switch (status) {
    case 'pending':
      return 'Pending';
    case 'assigned':
      return 'Assigned';
    case 'acknowledged':
      return 'Acknowledged';
    case 'in_progress':
      return 'In Progress';
    case 'completed':
      return 'Completed';
  }
}

export function statusActionLabel(status: ResponseStatus): string | null {
  switch (status) {
    case 'pending':
      return 'Assign Team B';
    case 'assigned':
      return 'Acknowledge';
    case 'acknowledged':
      return 'Start Response';
    case 'in_progress':
      return 'Mark Completed';
    default:
      return null;
  }
}
