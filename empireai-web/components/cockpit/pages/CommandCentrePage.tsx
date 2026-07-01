import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import {
  COMMAND_CENTRE_KPI_STRIP_IDS,
  getCockpitScreenDataMode,
} from "@/lib/cockpit/kpis/registry";
import { AgentActivityPlaceholder } from "@/components/cockpit/widgets/AgentActivityPlaceholder";
import { AiCeoBriefingPlaceholder } from "@/components/cockpit/widgets/AiCeoBriefingPlaceholder";
import { KpiStrip } from "@/components/cockpit/widgets/KpiStripPlaceholder";
import { PendingDecisionsPlaceholder } from "@/components/cockpit/widgets/PendingDecisionsPlaceholder";
import { PortfolioOverviewPlaceholder } from "@/components/cockpit/widgets/PortfolioOverviewPlaceholder";

/** SCR-010 — Command Centre composition (REAL-079 wireframe zones). */
export function CommandCentrePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow="Executive Command"
        title="Command Centre"
        dataMode={getCockpitScreenDataMode("SCR-010")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-lg border border-gold/15 px-3 py-1.5 text-xs text-[#c8c0b0]">
              Period · MTD
            </span>
            <span className="rounded-lg border border-gold/15 px-3 py-1.5 text-xs text-[#d4af37]">
              Export ↓
            </span>
          </div>
        }
      />

      <KpiStrip kpiIds={COMMAND_CENTRE_KPI_STRIP_IDS} columns={5} />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="flex flex-col gap-4">
          <AiCeoBriefingPlaceholder />
          <PendingDecisionsPlaceholder />
        </div>
        <div className="flex flex-col gap-4">
          <PortfolioOverviewPlaceholder />
          <AgentActivityPlaceholder />
        </div>
      </div>
    </div>
  );
}
