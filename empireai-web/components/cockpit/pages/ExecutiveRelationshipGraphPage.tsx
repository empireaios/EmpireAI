"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveRelationshipGraphProvider } from "@/lib/cockpit/hooks/useExecutiveRelationshipGraph";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveRelationshipGraphPanel } from "@/components/cockpit/widgets/ExecutiveRelationshipGraphPanel";

/** SCR-015 — Executive Relationship Graph · G4-08 */
export function ExecutiveRelationshipGraphPage() {
  return (
    <ExecutiveRelationshipGraphProvider>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Executive Command"
          title="Executive Relationship Graph"
          dataMode={getCockpitScreenDataMode("SCR-015")}
        />
        <ExecutiveRelationshipGraphPanel />
      </div>
    </ExecutiveRelationshipGraphProvider>
  );
}
