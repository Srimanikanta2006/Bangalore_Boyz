import type { CriticalityLevel } from '../types/domain';

export const RISK_THRESHOLD_CRITICAL = 75;
export const RISK_THRESHOLD_HIGH = 55;
export const RISK_THRESHOLD_MEDIUM = 35;
export const RISK_THRESHOLD_LOW = 15;

export function riskLevelFromScore(score: number): CriticalityLevel {
  if (score >= RISK_THRESHOLD_CRITICAL) return 'critical';
  if (score >= RISK_THRESHOLD_HIGH) return 'high';
  if (score >= RISK_THRESHOLD_MEDIUM) return 'medium';
  if (score >= RISK_THRESHOLD_LOW) return 'low';
  return 'normal';
}

/** Medium or worse = counted as "at risk" in the summary strip. */
export function isAtRiskLevel(level: CriticalityLevel): boolean {
  return level === 'medium' || level === 'high' || level === 'critical';
}

export function riskColor(level: CriticalityLevel): string {
  switch (level) {
    case 'critical':
      return '#ef4444';
    case 'high':
      return '#f97316';
    case 'medium':
      return '#f59e0b';
    case 'low':
      return '#22c55e';
    default:
      return '#475569';
  }
}

export function riskBgClass(level: CriticalityLevel): string {
  switch (level) {
    case 'critical':
      return 'bg-cs-critical/20 text-cs-critical border-cs-critical/40';
    case 'high':
      return 'bg-cs-high/20 text-cs-high border-cs-high/40';
    case 'medium':
      return 'bg-cs-medium/20 text-cs-medium border-cs-medium/40';
    case 'low':
      return 'bg-cs-low/20 text-cs-low border-cs-low/40';
    default:
      return 'bg-cs-normal/20 text-cs-textDim border-cs-border';
  }
}

export function riskLabel(level: CriticalityLevel): string {
  return level.toUpperCase();
}
