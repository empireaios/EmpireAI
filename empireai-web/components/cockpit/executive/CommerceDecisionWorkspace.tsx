"use client";

import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import type { CanonicalExecutiveTruth } from "@/lib/cockpit/panel-types";

type Opp = NonNullable<CanonicalExecutiveTruth["commerceOpportunity"]>;

/**
 * Large Grand King commerce decision surface — not a tiny accordion.
 * Consumes canonical Commerce truth; does not re-run Commerce analysis.
 */
export function CommerceDecisionWorkspace({
  onAskPillow,
}: {
  onAskPillow: (prompt: string) => void;
}) {
  const { data } = useExecutiveHome();
  const opp = data?.canonicalTruth?.commerceOpportunity ?? null;
  if (!opp) return null;

  const dossier =
    ("dossierSummary" in opp && typeof opp.dossierSummary === "string" && opp.dossierSummary) ||
    opp.summary;

  return (
    <section
      id="commerce-decision-workspace"
      data-testid="commerce-decision-workspace"
      aria-label="Commerce decision workspace"
      className="flex h-full min-h-[42vh] w-full flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04]"
    >
      <header className="shrink-0 border-b border-emerald-500/20 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Commerce opportunity — Grand King decision
        </p>
        <h3 className="mt-1 font-display text-xl text-[#f0d78c]">{opp.productName}</h3>
        <p className="mt-1 text-sm text-[#c8c0b0]">
          ASIN {opp.asin} · CJ {opp.cjPid} · SKU {opp.amazonSellerSku} ·{" "}
          {opp.offerPrice} · expected profit {opp.expectedProfitUsd} (EXPECTED)
        </p>
        <MetaRow opp={opp} />
      </header>

      <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-[#e8e0d0]">
          {dossier}
        </pre>
        <p className="mt-4 text-xs text-[#8a847a]">
          EXPECTED profit is not realised profit. Publication and supplier spend remain blocked until
          Grand King approval. ACCEPTED ≠ BUYABLE.
        </p>
      </div>

      <footer className="shrink-0 space-y-2 border-t border-emerald-500/20 px-5 py-4">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/20"
            onClick={() =>
              onAskPillow(
                [
                  `Discuss the commerce opportunity ASIN ${opp.asin} / SKU ${opp.amazonSellerSku}.`,
                  `Proposed price ${opp.offerPrice}, expected profit ${opp.expectedProfitUsd}.`,
                  "Explain competitiveness, delivery promise, risks, and what happens after approval.",
                  "Use the Commercial Decision Dossier context — do not ask me to restate the ASIN.",
                ].join(" "),
              )
            }
          >
            Ask Pillow about this
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
            onClick={() =>
              onAskPillow(
                `Why is the proposed selling price ${opp.offerPrice} commercially rational versus competing offers for ASIN ${opp.asin}?`,
              )
            }
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

function MetaRow({ opp }: { opp: Opp }) {
  const brand =
    "brandRoute" in opp && typeof opp.brandRoute === "string" ? opp.brandRoute : null;
  const rec =
    "pillowRecommendation" in opp && typeof opp.pillowRecommendation === "string"
      ? opp.pillowRecommendation
      : null;
  const delivery =
    "deliveryPromise" in opp && typeof opp.deliveryPromise === "string"
      ? opp.deliveryPromise
      : null;
  const competing =
    "competingOffers" in opp && opp.competingOffers != null
      ? String(opp.competingOffers)
      : null;

  return (
    <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
      <span className="rounded border border-gold/15 px-2 py-0.5 text-[#c8c0b0]">
        Status: {opp.approvalStatus} · {opp.disposition}
      </span>
      {brand && (
        <span className="rounded border border-gold/15 px-2 py-0.5 text-[#c8c0b0]">
          Brand route: {brand}
        </span>
      )}
      {rec && (
        <span className="rounded border border-gold/15 px-2 py-0.5 text-[#c8c0b0]">
          Pillow: {rec}
        </span>
      )}
      {competing && (
        <span className="rounded border border-gold/15 px-2 py-0.5 text-[#c8c0b0]">
          Competing offers: {competing}
        </span>
      )}
      {delivery && (
        <span className="max-w-full rounded border border-gold/15 px-2 py-0.5 text-[#8a847a]">
          Delivery: {delivery}
        </span>
      )}
    </div>
  );
}
