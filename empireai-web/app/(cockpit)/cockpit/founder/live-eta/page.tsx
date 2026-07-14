import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { LiveEtaDashboard } from "@/components/cockpit/live-eta/LiveEtaDashboard";

/** SCR P7-LIVE-ETA · P7-06 — Permanent Live ETA Experience */
export default function FounderLiveEtaPage() {
  return (
    <FounderWorkspaceLayout
      centreId="live_eta"
      title="Live ETA"
      subtitle="Mission countdown · supervisor timer · builder execution · confidence"
    >
      <LiveEtaDashboard />
    </FounderWorkspaceLayout>
  );
}
