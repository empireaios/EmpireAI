import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { MissionApprovalTriageColumnsPlaceholder } from "@/components/cockpit/widgets/MissionApprovalTriageColumnsPlaceholder";
import { MissionBlockerStripPlaceholder } from "@/components/cockpit/widgets/MissionBlockerStripPlaceholder";
import { MissionQueueFullPlaceholder } from "@/components/cockpit/widgets/MissionQueueFullPlaceholder";

/** SCR-020 — Mission Centre composition (REAL-079 wireframe zones). */
export function MissionCentrePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow="Executive Command"
        title="Mission Centre"
        dataMode={getCockpitScreenDataMode("SCR-020")}
        actions={
          <div className="flex flex-wrap gap-2 text-xs">
            {["Urgent (3)", "Pending (4)", "Done", "All"].map((filter, index) => (
              <span
                key={filter}
                className={`rounded-lg border px-3 py-1.5 ${
                  index === 0
                    ? "border-gold/30 bg-gold/10 text-[#f0d78c]"
                    : "border-gold/15 text-[#8a847a]"
                }`}
              >
                {filter}
              </span>
            ))}
          </div>
        }
      />

      <MissionBlockerStripPlaceholder />
      <MissionApprovalTriageColumnsPlaceholder />
      <MissionQueueFullPlaceholder />
    </div>
  );
}
