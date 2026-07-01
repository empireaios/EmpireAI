import { AgentActivityPlaceholder } from "@/components/cockpit/widgets/AgentActivityPlaceholder";
import { AiCeoBriefingPlaceholder } from "@/components/cockpit/widgets/AiCeoBriefingPlaceholder";
import {
  COMMAND_CENTRE_KPIS,
  KpiStrip,
} from "@/components/cockpit/widgets/KpiStripPlaceholder";
import { PendingDecisionsPlaceholder } from "@/components/cockpit/widgets/PendingDecisionsPlaceholder";
import { PortfolioOverviewPlaceholder } from "@/components/cockpit/widgets/PortfolioOverviewPlaceholder";

/** SCR-010 — Command Centre composition (REAL-079 wireframe zones). */
export function CommandCentrePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#6f6a60]">
            Executive Command
          </p>
          <h1 className="font-display text-2xl font-semibold text-[#f0d78c] sm:text-3xl">
            Command Centre
          </h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-lg border border-gold/15 px-3 py-1.5 text-xs text-[#c8c0b0]">
            Period · MTD
          </span>
          <span className="rounded-lg border border-gold/15 px-3 py-1.5 text-xs text-[#d4af37]">
            Export ↓
          </span>
        </div>
      </div>

      <KpiStrip items={COMMAND_CENTRE_KPIS} columns={5} />

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
