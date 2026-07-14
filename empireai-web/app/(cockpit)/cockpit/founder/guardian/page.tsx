import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { DevelopmentGuardianMonitoringPanel } from "@/components/cockpit/development/DevelopmentGuardianMonitoringPanel";

/** P7-02 — Guardian Centre */
export default function FounderGuardianPage() {
  return (
    <FounderWorkspaceLayout
      centreId="guardian"
      title="Guardian Centre"
      subtitle="Runtime health · infrastructure · performance · alerts · availability"
    >
      <DevelopmentGuardianMonitoringPanel />
    </FounderWorkspaceLayout>
  );
}
