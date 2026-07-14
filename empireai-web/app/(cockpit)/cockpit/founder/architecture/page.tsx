import { FounderWorkspaceLayout } from "@/components/cockpit/ux/FounderWorkspaceLayout";
import { RepositoryArchitectureExperience } from "@/components/cockpit/development/RepositoryArchitectureExperience";

/** P7-02 — Knowledge Centre · Repository Architecture Intelligence */
export default function RepositoryArchitecturePage() {
  return (
    <FounderWorkspaceLayout
      centreId="knowledge"
      title="Knowledge Centre"
      subtitle="Repository architecture intelligence · engineering findings"
    >
      <RepositoryArchitectureExperience />
    </FounderWorkspaceLayout>
  );
}
