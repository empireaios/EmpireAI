"use client";

import Link from "next/link";
import { CockpitPageHeader } from "@/components/cockpit/layout/CockpitPageHeader";
import { ExecutiveHomeBriefPanel } from "@/components/cockpit/executive/ExecutiveHomeBriefPanel";
import { ExecutiveHomeCentresGrid } from "@/components/cockpit/executive/ExecutiveHomeCentresGrid";
import { CommerceOperatingStrip } from "@/components/cockpit/commerce/CommerceOperatingDashboard";
import { CommerceDecisionWorkspace } from "@/components/cockpit/executive/CommerceDecisionWorkspace";
import { OneProductDecisionDossierPanel } from "@/components/cockpit/executive/OneProductDecisionDossierPanel";
import { GrandKingAttentionPanel } from "@/components/cockpit/executive/GrandKingAttentionPanel";
import { CanonicalTruthStrip } from "@/components/cockpit/executive/CanonicalTruthStrip";
import { PillowCommissioningStrip } from "@/components/cockpit/executive/PillowCommissioningStrip";
import { EmpireStatusBand } from "@/components/cockpit/executive/EmpireStatusBand";
import { PillowCompactPresence } from "@/components/cockpit/executive/PillowCompactPresence";
import { SinceLastVisitStrip } from "@/components/cockpit/executive/SinceLastVisitStrip";
import { ExecutiveHomeProvider, useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { getCockpitScreenDataMode } from "@/lib/cockpit/kpis/registry";
import { ExecutiveHomeGreetingLive } from "@/components/cockpit/widgets/ExecutiveHomeLiveWidgets";

function openPillowConversation(seed?: string) {
  if (seed?.trim()) {
    window.location.assign(
      `/cockpit/development/pillow?tab=conversation&ask=${encodeURIComponent(seed.trim().slice(0, 1200))}`,
    );
    return;
  }
  window.location.assign("/cockpit/development/pillow?tab=conversation");
}

function ExecutiveHomeDecisionWorkspace() {
  const { data, loading } = useExecutiveHome();
  const hasCommerceDecision = Boolean(data?.canonicalTruth?.commerceOpportunity);
  const hasCommissioning = Boolean(data?.canonicalTruth?.oneProductCommissioning);

  return (
    <div id="executive-pillow-anchor" className="w-full space-y-3">
      {loading && !data && (
        <p className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#8a847a]">
          Operational truth loading…
        </p>
      )}

      <OneProductDecisionDossierPanel onAskPillow={openPillowConversation} />

      {hasCommerceDecision && !hasCommissioning && (
        <CommerceDecisionWorkspace onAskPillow={openPillowConversation} />
      )}
      {hasCommerceDecision && hasCommissioning && (
        <details className="rounded-xl border border-gold/10 bg-white/[0.02] px-4 py-3">
          <summary className="cursor-pointer text-xs text-[#8a847a]">
            Other pending commerce opportunity (may differ from commissioning dossier)
          </summary>
          <div className="mt-3">
            <CommerceDecisionWorkspace onAskPillow={openPillowConversation} />
          </div>
        </details>
      )}

      <p className="text-center text-[11px] text-[#6f6a60]">
        Full conversation lives in{" "}
        <Link
          href="/cockpit/development/pillow?tab=conversation"
          className="text-[#d4af37] hover:underline"
        >
          Pillow Centre
        </Link>{" "}
        — Executive Home stays decision-first.
      </p>
    </div>
  );
}

/**
 * Grand King Executive Home — owner hierarchy:
 * Status → Pillow → Attention → Business truth → Since last visit → Decisions.
 * Full chat is not crammed into this page.
 */
export function ExecutiveHomePage() {
  return (
    <ExecutiveHomeProvider refreshMs={60_000}>
      <div className="mx-auto flex max-w-[1600px] flex-col gap-4">
        <CockpitPageHeader
          eyebrow="Grand King"
          title="Executive Home"
          dataMode={getCockpitScreenDataMode("SCR-001")}
        />
        <ExecutiveHomeGreetingLive />

        <EmpireStatusBand />
        <PillowCompactPresence onTalk={openPillowConversation} />
        <GrandKingAttentionPanel />
        <CanonicalTruthStrip />
        <SinceLastVisitStrip />
        <PillowCommissioningStrip />

        <ExecutiveHomeDecisionWorkspace />

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
