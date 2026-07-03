"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeProvider } from "@/lib/cockpit/hooks/useExecutiveHome";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveHomeGreetingLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
import {
  ExecutiveAlertsPanel,
  ExecutiveApprovalRoutingPanel,
  ExecutiveDependencyGraphPanel,
  ExecutiveTimelinePanel,
} from "@/components/cockpit/widgets/ExecutiveDashboardIntegration";
import {
  ExecutiveAttentionStrip,
  ExecutiveEngineHealthStrip,
  ExecutiveHomeSyncBar,
  ExecutiveNextActionStrip,
  ExecutivePriorityWidgetGrid,
} from "@/components/cockpit/widgets/ExecutiveSummaryCards";

/** SCR-001 — Executive Home · G4-06 live executive widgets. */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider>
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <CockpitPageHeader
          eyebrow="Executive Command"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeSyncBar />
        <ExecutiveHomeGreetingLive />
        <ExecutiveAttentionStrip />
        <ExecutiveNextActionStrip />
        <ExecutiveApprovalRoutingPanel />
        <ExecutivePriorityWidgetGrid />
        <ExecutiveAlertsPanel />
        <ExecutiveDependencyGraphPanel />
        <ExecutiveTimelinePanel />
        <ExecutiveEngineHealthStrip />
      </div>
    </ExecutiveHomeProvider>
  );
}
