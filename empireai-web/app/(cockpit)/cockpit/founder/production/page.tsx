import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { DevelopmentProductionModePanel } from "@/components/cockpit/development/DevelopmentProductionModePanel";

/** P7-02 — Production Centre */
export default function FounderProductionPage() {
  return (
    <FounderWorkspaceLayout
      centreId="production"
      title="Production Centre"
      subtitle="Production truth · deployment status · browser verification"
    >
      <DevelopmentProductionModePanel />
    </FounderWorkspaceLayout>
  );
}
