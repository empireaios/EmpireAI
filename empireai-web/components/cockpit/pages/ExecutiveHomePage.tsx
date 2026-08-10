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
      {/* Stack on all sizes: page scroll is primary; avoid dual 88vh scroll prisons. */}
      {hasDecision && <CommerceDecisionWorkspace onAskPillow={onAsk} />}
      <ExecutiveHomeChatWorkspace />
    </div>
  );
}

/**
 * SCR-001 · Grand King primary workflow:
 * urgent decisions → dossier → Pillow primary chat → secondary detail.
 * Document/page scroll is the primary navigation mechanism.
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

        <GrandKingAttentionPanel />
        <CanonicalTruthStrip />
        <PillowCommissioningStrip />

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
