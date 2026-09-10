interface MetricCardProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

export function MetricCard({ label, value, highlight }: MetricCardProps) {
  return (
    <div
      className={`flex flex-col gap-0.5 rounded border px-4 py-2.5 ${
        highlight
          ? 'border-cs-critical/40 bg-cs-critical/10'
          : 'border-cs-border bg-cs-panelAlt/60'
      }`}
    >
      <span className="text-[10px] font-medium uppercase tracking-widest text-cs-textDim">
        {label}
      </span>
      <span
        className={`font-mono text-xl font-semibold ${highlight ? 'text-cs-critical' : 'text-cs-text'}`}
      >
        {String(value).padStart(2, '0')}
      </span>
    </div>
  );
}
