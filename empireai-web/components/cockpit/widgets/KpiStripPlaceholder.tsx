import {
  type CockpitKpiDefinition,
  EXECUTIVE_HOME_KPI_STRIP_IDS,
  getCockpitKpisByIds,
} from "@/lib/cockpit/kpis/registry";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type KpiStripProps = {
  kpiIds: readonly string[];
  columns?: 4 | 5;
};

function gridClass(columns: 4 | 5) {
  return columns === 5
    ? "grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"
    : "grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4";
}

function KpiCard({ kpi }: { kpi: CockpitKpiDefinition }) {
  return (
    <div className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#6f6a60]">
        {kpi.label}
      </p>
      <div className="mt-2 flex items-baseline gap-2">
        <span className="font-display text-2xl text-[#f0d78c]">{kpi.placeholderValue}</span>
        {kpi.placeholderTrend && (
          <span className="text-sm text-emerald-400">{kpi.placeholderTrend}</span>
        )}
      </div>
      <div className="mt-2">
        <DataModeBadge mode={kpi.dataMode} />
      </div>
    </div>
  );
}

/** Reusable KPI strip — values from lib/cockpit/kpis/registry. */
export function KpiStrip({ kpiIds, columns = 4 }: KpiStripProps) {
  const kpis = getCockpitKpisByIds(kpiIds);

  return (
    <div className={gridClass(columns)}>
      {kpis.map((kpi) => (
        <KpiCard key={kpi.id} kpi={kpi} />
      ))}
    </div>
  );
}

/** REAL-079 Executive Home KPI strip (SCR-001). */
export function KpiStripPlaceholder() {
  return <KpiStrip kpiIds={EXECUTIVE_HOME_KPI_STRIP_IDS} columns={4} />;
}

export { COMMAND_CENTRE_KPI_STRIP_IDS } from "@/lib/cockpit/kpis/registry";
