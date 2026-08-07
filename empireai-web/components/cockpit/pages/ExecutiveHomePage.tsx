"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeBriefPanel } from "@/components/cockpit/executive/ExecutiveHomeBriefPanel";
import { ExecutiveHomeCentresGrid } from "@/components/cockpit/executive/ExecutiveHomeCentresGrid";
import { CommerceOperatingStrip } from "@/components/cockpit/commerce/CommerceOperatingDashboard";
import { DeferredExecutiveSystemStrips } from "@/components/cockpit/executive/DeferredExecutiveSystemStrips";
import { ExecutiveHomeChatWorkspace } from "@/components/cockpit/executive/ExecutiveHomeChatWorkspace";
import { ExecutiveEmpireAwarenessStrip } from "@/components/cockpit/ux/ExecutiveEmpireAwarenessStrip";
import { ExecutiveHomeProvider } from "@/lib/cockpit/hooks/useExecutiveHome";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import {
  CommandSnapshotLive,
  DepartmentHealthRowLive,
  ExecutiveHomeGreetingLive,
  ExecutiveHomeKpiStrip,
  MissionQueuePreviewLive,
  PortfolioPulseLive,
} from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
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

/**
 * SCR-001 · Daily Executive Operating System surface.
 * Extended certification strips are deferred — mounting them all caused production Brain 502s.
 */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider refreshMs={45_000}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <CockpitPageHeader
          eyebrow="Executive Cockpit · Daily Operations"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeSyncBar />
        <ExecutiveHomeGreetingLive />
        <ExecutiveHomeBriefPanel />
        <CommerceOperatingStrip />
        <ExecutiveEmpireAwarenessStrip />
        <ExecutiveHomeKpiStrip />
        <ExecutiveHomeCentresGrid />

        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(380px,520px)] xl:grid-cols-[minmax(0,1fr)_minmax(420px,560px)]">
          <div className="flex flex-col gap-4 overflow-y-auto lg:max-h-[calc(100vh-7rem)]">
            <ExecutiveAttentionStrip />
            <ExecutiveNextActionStrip />
            <ExecutivePriorityWidgetGrid />
            <div className="grid gap-4 lg:grid-cols-2">
              <CommandSnapshotLive />
              <MissionQueuePreviewLive />
            </div>
            <PortfolioPulseLive />
            <DepartmentHealthRowLive />
            <ExecutiveEngineHealthStrip />
            <ExecutiveApprovalRoutingPanel />
            <ExecutiveAlertsPanel />
            <ExecutiveTimelinePanel />
            <ExecutiveDependencyGraphPanel />
            <DeferredExecutiveSystemStrips />
          </div>
          <div className="min-h-[520px] lg:sticky lg:top-4 lg:self-start">
            <ExecutiveHomeChatWorkspace />
          </div>
        </div>
      </div>
    </ExecutiveHomeProvider>
  );
}
