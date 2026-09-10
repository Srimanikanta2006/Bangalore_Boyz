import { CloudRain, Loader2, RotateCcw } from 'lucide-react';
import type { SimulationPhase } from '../../types/domain';
import { Button } from '../ui/Button';

interface SimulationControlsProps {
  phase: SimulationPhase;
  simulating: boolean;
  onSimulate: () => void;
  onReset: () => void;
}

export function SimulationControls({
  phase,
  simulating,
  onSimulate,
  onReset,
}: SimulationControlsProps) {
  const baseline = phase === 'baseline';

  return (
    <div className="absolute left-4 top-4 z-10 flex flex-col gap-2">
      {baseline ? (
        <Button onClick={onSimulate} disabled={simulating} aria-label="Simulate rainfall escalation">
          {simulating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <CloudRain className="h-4 w-4" aria-hidden="true" />
          )}
          {simulating ? 'Simulating…' : 'Simulate Rainfall Escalation'}
        </Button>
      ) : (
        <Button
          variant="secondary"
          onClick={onReset}
          disabled={simulating}
          aria-label="Reset simulation"
        >
          {simulating ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <RotateCcw className="h-4 w-4" aria-hidden="true" />
          )}
          {simulating ? 'Resetting…' : 'Reset Simulation'}
        </Button>
      )}
      <span className="rounded border border-cs-border/60 bg-cs-panel/90 px-2 py-1 text-[10px] uppercase tracking-wider text-cs-textDim backdrop-blur-sm">
        {baseline ? 'Simulated · Baseline' : 'Simulated · Escalated'}
      </span>
    </div>
  );
}
