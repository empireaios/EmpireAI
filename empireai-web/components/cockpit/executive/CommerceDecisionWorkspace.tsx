"use client";

import { useState } from "react";
import Link from "next/link";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import type { CanonicalExecutiveTruth } from "@/lib/cockpit/panel-types";
import {
  toExecutiveCommerceLanguage,
  toPillowCommerceAskPrompt,
} from "@/lib/cockpit/executive/executive-language";
import {
  explainListingRoute,
  scrubMachineLanguage,
} from "@/lib/cockpit/executive/executive-presentation";

type Opp = NonNullable<CanonicalExecutiveTruth["commerceOpportunity"]>;

function parseMoney(raw: string | null | undefined): number | null {
  if (!raw) return null;
  const n = Number(String(raw).replace(/[^0-9.-]/g, ""));
  return Number.isFinite(n) ? n : null;
}

/**
 * Mission 007 — visual, decision-first commerce approval surface.
 * Technical dossier under progressive disclosure only.
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
  const route = explainListingRoute(opp.listingRoute);
  const ourPrice = parseMoney(opp.offerPrice);
  const competitor = opp.lowestCompetitorPriceUsd ?? null;
  const priceDelta =
    ourPrice != null && competitor != null ? ourPrice - competitor : null;
  const priceDeltaPct =
    priceDelta != null && competitor && competitor > 0
      ? (priceDelta / competitor) * 100
      : null;
  const demandUnknown = !opp.demandEvidence || /unknown/i.test(opp.demandEvidence);
  const expensiveVsMarket = priceDelta != null && priceDelta > 0;

  const risks: string[] = [];
  if (demandUnknown) risks.push("Demand has not been verified.");
  if (expensiveVsMarket) {
    risks.push(
      "Our proposed price is above the lowest competing offer — Pillow must justify why a customer would buy.",
    );
  }
  if (!opp.deliveryPromise) risks.push("Customer delivery expectation is incomplete.");
  if (opp.supplierCostUsd == null) risks.push("Supplier cost is not fully confirmed.");
  risks.push(
    "Offer is only live after Amazon BUYABLE verification — accepted is not buyable.",
  );

  return (
    <section
      id="commerce-decision-workspace"
      data-testid="commerce-decision-workspace"
      aria-label="Commerce decision workspace"
      className="flex w-full flex-col rounded-xl border border-emerald-500/30 bg-emerald-500/[0.04]"
    >
      <header className="border-b border-emerald-500/20 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Decision required — commerce opportunity
        </p>
        <h3 className="mt-1 font-display text-xl text-[#f0d78c]">{card.headline}</h3>
        <p className="mt-2 text-sm text-[#c8c0b0]">{card.supplierLine} · Sold on Amazon US</p>
      </header>

      <div className="grid gap-4 px-5 py-4 lg:grid-cols-[200px_minmax(0,1fr)]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gold/15 bg-black/40">
          {opp.catalogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={opp.catalogImageUrl}
              alt={card.headline}
              className="h-full w-full object-contain"
            />
          ) : (
            <p className="px-3 text-center text-xs text-[#6f6a60]">
              Product image not yet available from Amazon catalogue
            </p>
          )}
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-gold/15 bg-black/30 px-3 py-2">
            <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">Listing route</p>
            <p className="mt-1 text-sm font-medium text-[#f0d78c]">{route.title}</p>
            <p className="mt-1 text-xs leading-relaxed text-[#8a847a]">{route.explanation}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              label="Our price"
              value={opp.offerPrice}
              tone="gold"
              status="ESTIMATED"
            />
            <Metric
              label="Lowest competitor"
              value={
                competitor != null ? `$${competitor.toFixed(2)}` : "Unknown"
              }
              tone={expensiveVsMarket ? "warn" : "neutral"}
              status={competitor != null ? "PARTIAL" : "UNKNOWN"}
            />
            <Metric
              label="Price difference"
              value={
                priceDelta == null
                  ? "Unknown"
                  : `${priceDelta >= 0 ? "+" : ""}$${priceDelta.toFixed(2)}${
                      priceDeltaPct != null ? ` (${priceDeltaPct.toFixed(0)}%)` : ""
                    }`
              }
              tone={expensiveVsMarket ? "warn" : "neutral"}
              status={priceDelta == null ? "UNKNOWN" : "PARTIAL"}
            />
            <Metric
              label="Competing offers"
              value={opp.competingOffers ?? "Unknown"}
              status={opp.competingOffers ? "PARTIAL" : "UNKNOWN"}
            />
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Metric
              label="Supplier cost"
              value={
                opp.supplierCostUsd != null
                  ? `$${opp.supplierCostUsd.toFixed(2)}`
                  : "Unknown"
              }
              status={opp.supplierCostUsd != null ? "PARTIAL" : "UNKNOWN"}
            />
            <Metric
              label="Shipping"
              value={
                opp.shippingUsd != null ? `$${opp.shippingUsd.toFixed(2)}` : "Unknown"
              }
              status={opp.shippingUsd != null ? "PARTIAL" : "UNKNOWN"}
            />
            <Metric
              label="Expected profit"
              value={opp.expectedProfitUsd}
              tone="gold"
              status="ESTIMATED"
            />
            <Metric
              label="Expected margin"
              value={opp.expectedMarginPct}
              status="ESTIMATED"
            />
          </div>

          <p className="text-sm text-[#d4af37]">{card.recommendationLine}</p>
          <p className="text-sm text-emerald-100">{card.decisionLine}</p>
          {card.deliveryLine && (
            <p className="text-xs text-[#8a847a]">Delivery: {card.deliveryLine}</p>
          )}
          <p className="text-xs text-[#8a847a]">
            Demand:{" "}
            {demandUnknown
              ? "UNKNOWN — not verified"
              : scrubMachineLanguage(opp.demandEvidence ?? "")}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-emerald-500/15 px-5 py-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">Known risks</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#c8c0b0]">
            {risks.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 text-xs text-[#c8c0b0]">
            <p className="text-[#d4af37]">If you approve</p>
            <p className="mt-1">
              Pillow prepares the listing offer under governance. Publication and supplier spend
              still require the governed approval path. BUYABLE must be verified after publish.
            </p>
          </div>
          <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 text-xs text-[#c8c0b0]">
            <p className="text-[#d4af37]">If you reject</p>
            <p className="mt-1">
              This opportunity is not published. Pillow continues screening other products toward
              the 1,000 commercially ready surface.
            </p>
          </div>
        </div>

        <details
          className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2"
          open={techOpen}
          onToggle={(e) => setTechOpen((e.target as HTMLDetailsElement).open)}
        >
          <summary className="cursor-pointer text-xs font-medium text-[#8a847a]">
            Technical details / full evidence
          </summary>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-xs leading-relaxed text-[#6f6a60]">
            {scrubMachineLanguage(opp.dossierSummary ?? opp.summary)}
          </pre>
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
          <Link
            href="/cockpit/development/approvals"
            className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs font-medium text-emerald-100 hover:bg-emerald-500/20"
          >
            Approve / Reject in queue
          </Link>
          <button
            type="button"
            className="rounded-lg border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-medium text-[#d4af37] hover:bg-gold/20"
            onClick={() => onAskPillow(toPillowCommerceAskPrompt(opp, "discuss"))}
          >
            Ask Pillow
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
            onClick={() =>
              onAskPillow(
                [
                  toPillowCommerceAskPrompt(opp, "challenge"),
                  competitor != null
                    ? `Lowest competing offer is about $${competitor.toFixed(2)}. Explain why a customer would buy at our price.`
                    : "Competitor price is unknown — explain the risk.",
                  demandUnknown ? "Demand evidence is UNKNOWN — say so clearly." : "",
                ]
                  .filter(Boolean)
                  .join(" "),
              )
            }
          >
            Challenge Pillow
          </button>
          <Link
            href="/cockpit/commerce/operating"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
          >
            Commerce Centre
          </Link>
        </div>
        <p className="text-[10px] text-[#6f6a60]">
          Expected profit is not realised profit. Approve/Reject persist only through the governed
          approval queue. No publish/spend without your explicit decision.
        </p>
      </footer>
    </section>
  );
}

function Metric({
  label,
  value,
  tone = "neutral",
  status,
}: {
  label: string;
  value: string;
  tone?: "neutral" | "gold" | "warn";
  status: string;
}) {
  const valueClass =
    tone === "gold"
      ? "text-[#f0d78c]"
      : tone === "warn"
        ? "text-amber-200"
        : "text-[#e8e0d0]";
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-2 py-2">
      <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className={`mt-1 text-sm font-medium ${valueClass}`}>{value}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#5a564e]">{status}</p>
    </div>
  );
}
