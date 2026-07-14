import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { DevelopmentSupervisorSystemPanel } from "@/components/cockpit/development/DevelopmentSupervisorSystemPanel";

/** P7-02 — Supervisor Centre */
export default function FounderSupervisorPage() {
  return (
    <FounderWorkspaceLayout
      centreId="supervisor"
      title="Supervisor Centre"
      subtitle="Current mission · progress · step · ETA · recovery · mission health"
    >
      <DevelopmentSupervisorSystemPanel />
    </FounderWorkspaceLayout>
  );
}
