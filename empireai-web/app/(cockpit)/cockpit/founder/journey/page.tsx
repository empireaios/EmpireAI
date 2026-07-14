import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { DevelopmentJourneyPanel } from "@/components/cockpit/development/DevelopmentJourneyPanel";

/** P7-02 — Journey Centre */
export default function FounderJourneyPage() {
  return (
    <FounderWorkspaceLayout
      centreId="journey"
      title="Journey Centre"
      subtitle="Empire journey position · roadmap · mission history"
    >
      <DevelopmentJourneyPanel />
    </FounderWorkspaceLayout>
  );
}
