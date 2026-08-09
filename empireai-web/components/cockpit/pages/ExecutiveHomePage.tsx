"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeBriefPanel } from "@/components/cockpit/executive/ExecutiveHomeBriefPanel";
import { ExecutiveHomeCentresGrid } from "@/components/cockpit/executive/ExecutiveHomeCentresGrid";
import { CommerceOperatingStrip } from "@/components/cockpit/commerce/CommerceOperatingDashboard";
import { ExecutiveHomeChatWorkspace } from "@/components/cockpit/executive/ExecutiveHomeChatWorkspace";
import { GrandKingAttentionPanel } from "@/components/cockpit/executive/GrandKingAttentionPanel";
import { CanonicalTruthStrip } from "@/components/cockpit/executive/CanonicalTruthStrip";
import { ExecutiveHomeProvider } from "@/lib/cockpit/hooks/useExecutiveHome";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveHomeGreetingLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
import { ExecutiveHomeSyncBar } from "@/components/cockpit/widgets/ExecutiveSummaryCards";

/**
 * SCR-001 · Total-truth Executive Home.
 * Chat is the primary workspace; centres remain for drill-down.
 */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider refreshMs={45_000}>
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <CockpitPageHeader
          eyebrow="Executive Cockpit · Daily Operations"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeSyncBar />
        <ExecutiveHomeGreetingLive />
        <GrandKingAttentionPanel />
        <CanonicalTruthStrip />
        <ExecutiveHomeBriefPanel />
        <CommerceOperatingStrip />

        {/* Desktop: chat occupies ~65–70% width and ~75–85vh */}
        <div className="grid min-h-0 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
          <div className="flex min-h-0 flex-col gap-4 lg:max-h-[85vh] lg:overflow-y-auto">
            <ExecutiveHomeCentresGrid />
          </div>
          <div className="min-h-[70vh] lg:min-h-[75vh]">
            <ExecutiveHomeChatWorkspace />
          </div>
        </div>
      </div>
    </ExecutiveHomeProvider>
  );
}
