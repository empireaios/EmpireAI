type KpiPlaceholderItem = {
  id: string;
  label: string;
  value: string;
  trend?: string;
  mode: "Live" | "Demo" | "Sandbox";
};

const EXECUTIVE_KPIS: KpiPlaceholderItem[] = [
  { id: "K-E-001", label: "GMV MTD", value: "$1.24M", trend: "▲", mode: "Live" },
  { id: "K-E-002", label: "Net Margin", value: "36.3%", trend: "▲", mode: "Live" },
  { id: "K-E-003", label: "Pending Decisions", value: "3", mode: "Live" },
  { id: "K-E-004", label: "Open Missions", value: "7", mode: "Live" },
];

export const COMMAND_CENTRE_KPIS: KpiPlaceholderItem[] = [
  { id: "K-C-001", label: "GMV", value: "$1.24M", mode: "Live" },
  { id: "K-C-002", label: "Margin", value: "36.3%", mode: "Live" },
  { id: "K-C-003", label: "Companies", value: "12", mode: "Live" },
  { id: "K-C-004", label: "Agents", value: "18", mode: "Live" },
  { id: "K-C-005", label: "Profit Today", value: "+$4.2k", trend: "▲", mode: "Live" },
];

type KpiStripProps = {
  items: KpiPlaceholderItem[];
  columns?: 4 | 5;
};

function gridClass(columns: 4 | 5) {
  return columns === 5
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4";
}

/** Reusable KPI strip — static placeholder cards. */
export function KpiStrip({ items, columns = 4 }: KpiStripProps) {
  return (
    <div className={gridClass(columns)}>
      {items.map((kpi) => (
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

/** REAL-079 Executive Home KPI strip (W-E-001–004). */
export function KpiStripPlaceholder() {
  return <KpiStrip items={EXECUTIVE_KPIS} columns={4} />;
}
