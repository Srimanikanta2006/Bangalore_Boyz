import { CheckCircle2, ChevronRight } from 'lucide-react';
import type { Asset, ResponseAction } from '../../types/domain';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { statusLabel } from '../../utils/responseTransitions';
import { formatTimestamp } from '../../utils/format';

interface ActiveResponseBarProps {
  response: ResponseAction | null;
  assetMap: Record<string, Asset>;
  onViewIncident: () => void;
}

export function ActiveResponseBar({
  response,
  assetMap,
  onViewIncident,
}: ActiveResponseBarProps) {
  if (!response) {
    return (
      <div className="flex h-14 items-center border-t border-cs-border bg-cs-panel px-4 lg:px-6" role="status">
        <span className="text-xs text-cs-textDim">No active response tasks</span>
      </div>
    );
  }

  const target = assetMap[response.targetAssetId];
  const completed = response.status === 'completed';

  return (
    <div className="flex h-16 items-center justify-between gap-4 border-t border-cs-border bg-cs-panel px-4 lg:px-6">
      <div className="flex min-w-0 items-center gap-6">
        <div className="min-w-0">
          <span className="text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
            Active Response
          </span>
          <div className="flex min-w-0 items-center gap-3">
            {completed && (
              <CheckCircle2 className="h-4 w-4 shrink-0 text-cs-low" aria-hidden="true" />
            )}
            <span className="font-mono text-sm font-semibold text-cs-primary">
              {response.assignedTeam}
            </span>
            <span className="truncate text-sm text-cs-text">{response.description}</span>
            <span className="hidden text-xs text-cs-textDim sm:inline">{target?.name}</span>
          </div>
        </div>
        <Badge level="critical" />
      </div>

      <div className="flex shrink-0 items-center gap-4">
        <div className="text-right" aria-live="polite">
          <span className="text-[10px] uppercase tracking-widest text-cs-textDim">Status</span>
          <div className={`text-sm font-medium ${completed ? 'text-cs-low' : 'text-cs-primary'}`}>
            {statusLabel(response.status)}
            {completed && response.completedAt ? ` · ${formatTimestamp(response.completedAt)}` : ''}
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={onViewIncident}>
          View Incident
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
