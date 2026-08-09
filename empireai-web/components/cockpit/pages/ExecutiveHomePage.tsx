"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeBriefPanel } from "@/components/cockpit/executive/ExecutiveHomeBriefPanel";
import { ExecutiveHomeCentresGrid } from "@/components/cockpit/executive/ExecutiveHomeCentresGrid";
import { CommerceOperatingStrip } from "@/components/cockpit/commerce/CommerceOperatingDashboard";
import { CommerceDecisionWorkspace } from "@/components/cockpit/executive/CommerceDecisionWorkspace";
import { ExecutiveHomeChatWorkspace } from "@/components/cockpit/executive/ExecutiveHomeChatWorkspace";
import { GrandKingAttentionPanel } from "@/components/cockpit/executive/GrandKingAttentionPanel";
import { CanonicalTruthStrip } from "@/components/cockpit/executive/CanonicalTruthStrip";
import { ExecutiveHomeProvider } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveHomeGreetingLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
import { ExecutiveHomeSyncBar } from "@/components/cockpit/widgets/ExecutiveSummaryCards";

function ExecutiveHomePrimaryWorkspace() {
  const { ask, setQueryDraft } = useGlobalAiAssistant();
  return (
    <>
      <CommerceDecisionWorkspace
        onAskPillow={(prompt) => {
          setQueryDraft(prompt);
          void ask(prompt);
          window.dispatchEvent(new CustomEvent("empireai:focus-pillow"));
        }}
      />
      <div id="executive-pillow-anchor" className="min-h-0 w-full">
        <ExecutiveHomeChatWorkspace />
      </div>
    </>
  );
}

/**
 * SCR-001 · Grand King primary workflow:
 * urgent decisions → dossier + Pillow → secondary operational detail.
 * Pillow must be above the fold and own usable content width.
 */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider refreshMs={45_000}>
      <div className="mx-auto flex max-w-[1800px] flex-col gap-3">
        <CockpitPageHeader
          eyebrow="Executive Cockpit · Daily Operations"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeSyncBar />
        <ExecutiveHomeGreetingLive />

        <GrandKingAttentionPanel />
        <CanonicalTruthStrip />

        <ExecutiveHomePrimaryWorkspace />

        <CommerceOperatingStrip />
        <ExecutiveHomeBriefPanel />
        <section aria-label="Secondary centre summaries" className="w-full">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f6a60]">
            Secondary centre summaries
          </p>
          <ExecutiveHomeCentresGrid />
        </section>
      </div>
    </ExecutiveHomeProvider>
  );
}
