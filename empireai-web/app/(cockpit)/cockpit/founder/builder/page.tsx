import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { BuilderConsoleDashboard } from "@/components/cockpit/builder/BuilderConsoleDashboard";

/** SCR P7-BUILDER · P7-05 — Permanent Builder Console */
export default function FounderBuilderPage() {
  return (
    <FounderWorkspaceLayout
      centreId="builder"
      title="Builder Console"
      subtitle="Live engineering command centre · mission · repository · validation · recovery"
    >
      <BuilderConsoleDashboard />
    </FounderWorkspaceLayout>
  );
}
