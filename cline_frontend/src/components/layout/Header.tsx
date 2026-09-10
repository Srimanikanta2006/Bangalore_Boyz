import { useEffect, useState } from 'react';
import { AlertTriangle, Radio } from 'lucide-react';
import type { Hazard, SimulationPhase } from '../../types/domain';

interface HeaderProps {
  hazard: Hazard | null;
  simulationPhase: SimulationPhase;
}

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div className="text-right" aria-label="Console time">
      <div className="font-mono text-sm text-cs-text">{time}</div>
      <div className="text-[10px] text-cs-textDim">{date}</div>
    </div>
  );
}

export function Header({ hazard, simulationPhase }: HeaderProps) {
  const escalated = simulationPhase === 'escalated';

  return (
    <header className="flex items-center justify-between border-b border-cs-border bg-cs-panel px-4 py-3 lg:px-6">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-cs-text">ClimateShield</h1>
          <p className="text-xs text-cs-textDim">Vijayawada District</p>
        </div>

        {hazard && (
          <div
            className={`flex items-center gap-3 rounded-lg border px-4 py-2 ${
              escalated
                ? 'border-cs-critical/50 bg-cs-critical/10'
                : 'border-cs-medium/40 bg-cs-medium/10'
            }`}
            role="status"
          >
            <AlertTriangle
              className={`h-5 w-5 ${escalated ? 'text-cs-critical' : 'text-cs-medium'}`}
              aria-hidden="true"
            />
            <div>
              <div className="flex items-center gap-2 text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
                <span>{escalated ? 'Active Hazard' : 'Hazard Watch'}</span>
                <span
                  className="rounded border border-cs-border px-1 text-[9px] tracking-wider text-cs-textDim"
                  title="Demo scenario is simulated, not live telemetry"
                >
                  Simulated
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold uppercase text-cs-text">{hazard.label}</span>
                <span className={`font-mono text-sm ${escalated ? 'text-cs-critical' : 'text-cs-medium'}`}>
                  SEV {hazard.severity}
                </span>
                {hazard.rainfallMmHr !== undefined && (
                  <span className="font-mono text-xs text-cs-textDim">{hazard.rainfallMmHr} mm/hr</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cs-low opacity-40" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cs-low" />
          </span>
          <span className="flex items-center gap-1 text-xs font-medium uppercase tracking-wider text-cs-low">
            <Radio className="h-3 w-3" aria-hidden="true" />
            {escalated ? 'Live' : 'Monitoring'}
          </span>
        </div>
        <LiveClock />
        <div className="rounded border border-cs-border bg-cs-panelAlt px-3 py-1.5">
          <span className="font-mono text-xs text-cs-textDim">OPS-01</span>
        </div>
      </div>
    </header>
  );
}
