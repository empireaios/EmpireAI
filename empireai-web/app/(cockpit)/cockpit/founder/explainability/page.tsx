import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { ExplainabilityDashboard } from "@/components/cockpit/explainability/ExplainabilityDashboard";

/** SCR P7-EXPLAIN · P7-07 — Permanent Explainability Architecture */
export default function FounderExplainabilityPage() {
  return (
    <FounderWorkspaceLayout
      centreId="explainability"
      title="Explainability"
      subtitle="WHY · WHAT · HOW · PROOF · evidence · confidence · alternatives"
    >
      <ExplainabilityDashboard />
    </FounderWorkspaceLayout>
  );
}
