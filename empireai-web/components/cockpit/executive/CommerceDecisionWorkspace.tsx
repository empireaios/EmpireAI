"use client";

import { useState } from "react";
import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import type { CanonicalExecutiveTruth } from "@/lib/cockpit/panel-types";
import {
  toExecutiveCommerceLanguage,
  toPillowCommerceAskPrompt,
} from "@/lib/cockpit/executive/executive-language";

type Opp = NonNullable<CanonicalExecutiveTruth["commerceOpportunity"]>;

/**
 * Large Grand King commerce decision surface — natural language first.
 * Technical IDs under disclosure only.
 */
export function CommerceDecisionWorkspace({
  onAskPillow,
}: {
  onAskPillow: (prompt: string) => void;
}) {
  const { data } = useExecutiveHome();
  const opp = data?.canonicalTruth?.commerceOpportunity ?? null;
  const [techOpen, setTechOpen] = useState(false);
  if (!opp) return null;

  const card = toExecutiveCommerceLanguage(opp as Opp & Record<string, unknown>);
  const dossier =
    ("dossierSummary" in opp && typeof opp.dossierSummary === "string" && opp.dossierSummary) ||
    opp.summary;

  return (
    <section
      id="commerce-decision-workspace"
      data-testid="commerce-decision-workspace"
      aria-label="Commerce decision workspace"
      className="flex w-full flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04]"
    >
      <header className="border-b border-emerald-500/20 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Commerce opportunity — Grand King decision
        </p>
        <h3 className="mt-1 font-display text-xl text-[#f0d78c]">{card.headline}</h3>
        <p className="mt-2 text-sm leading-relaxed text-[#c8c0b0]">{card.supplierLine}</p>
        <p className="mt-1 text-sm leading-relaxed text-[#e8e0d0]">{card.economicsLine}</p>
        {card.competitionLine && (
          <p className="mt-1 text-sm text-[#c8c0b0]">{card.competitionLine}</p>
        )}
        {card.deliveryLine && (
          <p className="mt-1 text-sm text-[#8a847a]">{card.deliveryLine}</p>
        )}
        <p className="mt-2 text-sm text-[#d4af37]">{card.recommendationLine}</p>
        <p className="mt-1 text-sm font-medium text-emerald-100">{card.decisionLine}</p>
      </header>

      <div className="px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#e8e0d0]">
          {dossier}
        </pre>
        <p className="mt-4 text-xs text-[#8a847a]">
          EXPECTED profit is not realised profit. Publication and supplier spend remain blocked until
          Grand King approval. Accepted catalogue status is not the same as buyable inventory.
        </p>

        <details
          className="mt-4 rounded-lg border border-gold/10 bg-black/20 px-3 py-2"
          open={techOpen}
          onToggle={(e) => setTechOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-xs font-medium text-[#8a847a]">
            Technical details / evidence
          </summary>
          <dl className="mt-2 space-y-1 text-xs text-[#6f6a60]">
            {card.technicalDetails.map((row) => (
              <div key={row.label} className="flex flex-wrap gap-2">
                <dt className="min-w-[8rem] text-[#8a847a]">{row.label}</dt>
                <dd className="font-mono text-[#c8c0b0]">{row.value}</dd>
              </div>
            ))}
          </dl>
        </details>
      </div>

      <footer className="space-y-2 border-t border-emerald-500/20 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/20"
            onClick={() => onAskPillow(toPillowCommerceAskPrompt(opp, "discuss"))}
          >
            Ask Pillow about this
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
            onClick={() => onAskPillow(toPillowCommerceAskPrompt(opp, "challenge"))}
          >
            Challenge the price
          </button>
          <Link
            href="/cockpit/development/approvals"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Open approval queue
          </Link>
          <Link
            href="/cockpit/commerce/store"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
          >
            Commerce Centre
          </Link>
        </div>
        <p className="text-[10px] text-[#6f6a60]">
          Approve / Reject persist only through the governed approval queue — not from decorative
          cards. No publish/spend without explicit Grand King decision.
        </p>
      </footer>
    </section>
  );
}
