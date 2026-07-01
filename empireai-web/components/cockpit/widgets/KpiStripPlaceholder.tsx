type KpiPlaceholder = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  mode: "Live" | "Demo" | "Sandbox";
};

const PLACEHOLDER_KPIS: KpiPlaceholder[] = [
  { id: "K-E-001", label: "GMV MTD", value: "$1.24M", trend: "▲", mode: "Live" },
  { id: "K-E-002", label: "Net Margin", value: "36.3%", trend: "▲", mode: "Live" },
  { id: "K-E-003", label: "Pending Decisions", value: "3", mode: "Live" },
  { id: "K-E-004", label: "Open Missions", value: "7", mode: "Live" },
];

/** REAL-079 zone: KPI strip (W-E-001–004 placeholders). */
export function KpiStripPlaceholder() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {PLACEHOLDER_KPIS.map((kpi) => (
        <div
          key={kpi.id}
          className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-4"
        >
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
            {kpi.label}
          </p>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="font-display text-2xl text-[#f0d78c]">{kpi.value}</span>
            {kpi.trend && (
              <span className="text-sm text-emerald-400">{kpi.trend}</span>
            )}
          </div>
          <p className="mt-2 text-[10px] font-medium uppercase tracking-wider text-emerald-400/80">
            {kpi.mode}
          </p>
        </div>
      ))}
    </div>
  );
}
