"use client";

import { IntelligenceDiscoveryPanel } from "@/components/cockpit/widgets/IntelligenceEnginePanels";
import { Panel } from "@/components/platform/ui/PlatformPrimitives";

function IntelligenceResearchNotImplemented() {
  return (
    <Panel title="Research Missions" subtitle="Capability not yet implemented">
      <p className="text-sm text-[#8a847a]">
        Autonomous research mission queue is not wired in G4-02. Quantitative scoring uses live PIE
        data in the panel above.
      </p>
    </Panel>
  );
}

export default function IntelligenceDiscoveryPage() {
  return (
    <div className="space-y-6">
      <IntelligenceDiscoveryPanel />
      <IntelligenceResearchNotImplemented />
    </div>
  );
}
