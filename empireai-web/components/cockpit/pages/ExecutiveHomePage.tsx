"use client";

import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeBriefPanel } from "@/components/cockpit/executive/ExecutiveHomeBriefPanel";
import { ExecutiveHomeCentresGrid } from "@/components/cockpit/executive/ExecutiveHomeCentresGrid";
import { CommerceOperatingStrip } from "@/components/cockpit/commerce/CommerceOperatingDashboard";
import { CommerceDecisionWorkspace } from "@/components/cockpit/executive/CommerceDecisionWorkspace";
import { ExecutiveHomeChatWorkspace } from "@/components/cockpit/executive/ExecutiveHomeChatWorkspace";
import { GrandKingAttentionPanel } from "@/components/cockpit/executive/GrandKingAttentionPanel";
import { CanonicalTruthStrip } from "@/components/cockpit/executive/CanonicalTruthStrip";
import { PillowCommissioningStrip } from "@/components/cockpit/executive/PillowCommissioningStrip";
import { ExecutiveHomeProvider, useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveHomeGreetingLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";
import { ExecutiveHomeSyncBar } from "@/components/cockpit/widgets/ExecutiveSummaryCards";

function ExecutiveHomePrimaryWorkspace() {
  const { ask, setQueryDraft } = useGlobalAiAssistant();
  const { data, loading } = useExecutiveHome();
  const hasDecision = Boolean(data?.canonicalTruth?.commerceOpportunity);

  const onAsk = (prompt: string) => {
    setQueryDraft(prompt);
    void ask(prompt);
    window.dispatchEvent(new CustomEvent("empireai:focus-pillow"));
  };

  return (
    <div id="executive-pillow-anchor" className="w-full space-y-3">
      {loading && !data && (
        <p className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#8a847a]">
          Operational truth loading — Pillow is available below.
        </p>
      )}
      {/* Decision before chat — Grand King decides first, then converses. */}
      {hasDecision && <CommerceDecisionWorkspace onAskPillow={onAsk} />}
      <ExecutiveHomeChatWorkspace />
    </div>
  );
}

/**
 * Mission 007 · SCR-001 decision-first Grand King Home:
 * Attention → money/truth → Pillow status → decisions → chat → secondary.
 * Page scrolls the operating surface; Pillow chat uses a bounded shell.
 */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider refreshMs={60_000}>
      <div className="mx-auto flex max-w-[1800px] flex-col gap-4">
        <CockpitPageHeader
          eyebrow="Executive Cockpit · Daily Operations"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeSyncBar />
        <ExecutiveHomeGreetingLive />

        {/* 1. What needs my attention? */}
        <GrandKingAttentionPanel />

        {/* 2. What is the money / operating truth? */}
        <CanonicalTruthStrip />
        <PillowCommissioningStrip />

        {/* 3. Decision + Pillow chat */}
        <ExecutiveHomePrimaryWorkspace />

        {/* 4. Secondary operating detail */}
        <details className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-3">
          <summary className="cursor-pointer text-xs font-medium text-[#8a847a]">
            More operating detail (commerce strip · brief · centres)
          </summary>
          <div className="mt-3 space-y-4">
            <CommerceOperatingStrip />
            <ExecutiveHomeBriefPanel />
            <section aria-label="Secondary centre summaries" className="w-full">
              <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#6f6a60]">
                Secondary centre summaries
              </p>
              <ExecutiveHomeCentresGrid />
            </section>
          </div>
        </details>
      </div>
    </ExecutiveHomeProvider>
  );
}
