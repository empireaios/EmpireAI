"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { useGlobalAiAssistant } from "@/lib/cockpit/global-assistant/GlobalAiAssistantProvider";
import { humanizeOperatingTerm, scrubMachineLanguage } from "@/lib/cockpit/executive/executive-presentation";

/**
 * Compact Pillow presence for Executive Home — not a full chat application.
 * Talk to Pillow opens the dedicated conversation workspace.
 */
export function PillowCompactPresence({
  onTalk,
}: {
  onTalk?: (seed?: string) => void;
}) {
  const { data } = useExecutiveHome();
  const { conversation, executiveReady, readinessLabel } = useGlobalAiAssistant();
  const t = data?.canonicalTruth;
  const pillow = t?.pillowOperatingState;
  const lastPillow = [...conversation].reverse().find((m) => m.role === "pillow");
  const needsYou = Boolean(
    (t?.grandKingAttention?.length ?? 0) > 0 || t?.sinceLastVisit?.needsGrandKing,
  );

  const doing = scrubMachineLanguage(
    humanizeOperatingTerm(
      pillow?.humanLabel ||
        pillow?.currentFocus ||
        (executiveReady ? "Monitoring commerce and preparing owner decisions" : readinessLabel) ||
        "Starting executive intelligence",
    ),
  );

  return (
    <section
      aria-label="Pillow presence"
      data-testid="pillow-compact-presence"
      className="rounded-xl border border-gold/20 bg-white/[0.02] px-5 py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#d4af37]">
            Pillow
          </p>
          <p className="mt-1 text-lg text-[#f0d78c]">
            {needsYou ? "Needs your attention" : "Working within authority"}
          </p>
          <p className="mt-2 text-sm leading-relaxed text-[#c8c0b0]">
            Currently: {doing}
          </p>
          {lastPillow && (
            <p className="mt-3 line-clamp-2 text-sm text-[#8a847a]">
              Latest: {lastPillow.content.slice(0, 220)}
              {lastPillow.content.length > 220 ? "…" : ""}
            </p>
          )}
        </div>
        <div className="flex shrink-0 flex-col gap-2">
          <Link
            href="/cockpit/development/pillow?tab=conversation"
            className="rounded-lg bg-gold/15 px-4 py-2 text-center text-xs font-medium text-[#d4af37] hover:bg-gold/25"
            onClick={() => onTalk?.()}
          >
            Talk to Pillow
          </Link>
          <button
            type="button"
            className="rounded-lg border border-gold/20 px-4 py-2 text-xs text-[#c8c0b0] hover:border-gold/40"
            onClick={() =>
              onTalk?.(
                "Summarise what needs my attention and what you are doing right now — owner language only.",
              )
            }
          >
            Ask Pillow
          </button>
        </div>
      </div>
    </section>
  );
}
