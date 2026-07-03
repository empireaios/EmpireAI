import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import {
  MissionApprovalTriageLive,
  MissionBlockerStripLive,
  MissionQueueFullLive,
} from "@/components/cockpit/widgets/MissionCentreLiveWidgets";

/** SCR-020 — Mission Centre composition (G4-02 live). */
export function MissionCentrePage() {
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <CockpitPageHeader
        eyebrow="Executive Command"
        title="Mission Centre"
        dataMode={getCockpitScreenDataMode("SCR-020")}
      />
      <MissionBlockerStripLive />
      <MissionApprovalTriageLive />
      <MissionQueueFullLive />
    </div>
  );
}
