import type { CriticalityLevel } from '../../types/domain';
import { riskBgClass, riskLabel } from '../../utils/riskColors';

interface BadgeProps {
  level: CriticalityLevel;
  className?: string;
}

export function Badge({ level, className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-semibold tracking-wider ${riskBgClass(level)} ${className}`}
    >
      {riskLabel(level)}
    </span>
  );
}
