import type { DashboardSummary } from '../../types/domain';
import { MetricCard } from '../ui/MetricCard';

interface SummaryStripProps {
  summary: DashboardSummary | null;
}

export function SummaryStrip({ summary }: SummaryStripProps) {
  if (!summary) return null;

  return (
    <div className="grid grid-cols-2 gap-2 border-b border-cs-border bg-cs-bg px-4 py-3 sm:grid-cols-3 lg:flex lg:gap-3 lg:px-6">
      <MetricCard label="Active Hazards" value={summary.activeHazards} highlight />
      <MetricCard label="Assets at Risk" value={summary.assetsAtRisk} />
      <MetricCard label="Critical" value={summary.criticalAssets} highlight />
      <MetricCard label="Responses" value={summary.activeResponses} />
      <MetricCard label="Services at Risk" value={summary.servicesAtRisk} highlight />
    </div>
  );
}
