"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

type MoneyField = {
  label: string;
  display: string;
  amountUsd?: number | null;
  status: string;
  source: string;
};

type DecisionDossier = {
  computedAt: string;
  identityReconciliation: {
    nordicBeddingStatus: string;
    nordicNote: string;
    commerceOpportunityDistinct: boolean;
    commerceOpportunityName: string | null;
  };
  selection: {
    selectionAuthority: string;
    cursorSelected: boolean;
    selectedAt: string;
    opportunityId: string;
  };
  funnel: {
    candidatesEvaluated: number | null;
    rejectedBeforeDeepAnalysis: number | null;
    smartViableSurvivors: number | null;
    finalists: Array<{
      productName: string;
      expectedProfit: string;
      opportunityId: string;
      role: string;
      whyLost: string | null;
    }>;
    whyWinnerWon: string;
    historicalFunnelDetail: string;
  };
  product: {
    plainName: string;
    listingRouteExplanation: string;
    brandRoute: string | null;
    imageAvailable: boolean;
    catalogImageUrl: string | null;
    customerReceives: string;
  };
  supplier: {
    name: string;
    stockUnits: number | null;
    supplierCost: MoneyField;
    freight: MoneyField;
  };
  economics: {
    ourPrice: MoneyField;
    lowestCompetitor: MoneyField;
    priceDifference: MoneyField;
    priceDifferencePct: string;
    competingOfferCount: string;
    featuredOffer: string;
    amazonFees: MoneyField;
    landedCost: MoneyField;
    breakEven: MoneyField;
    expectedProfit: MoneyField;
    expectedMargin: string;
  };
  demand: { evidence: string; confidence: string };
  delivery: { customerPromise: string; supplierCanMeet: string };
  eligibility: {
    amazonEligibility: string;
    restrictionStatus: string;
    brandIp: string;
  };
  risks: string[];
  prominentCompetitionRisk: string | null;
  pillowRecommendation: {
    verdict: string;
    confidence?: string;
    why: string;
    whatWouldChangeMind: string[];
    unsureAbout?: string[];
  };
  grandKingDecision: {
    ifApprove: string[];
    ifReject: string[];
    currentState: string;
  };
  challengeInterface: {
    ready: boolean;
    askPromptSeed: string;
    exampleChallenges: string[];
    cq05Status: string;
  };
  technicalAppendix: Record<string, string | null>;
  unknownFields: string[];
  governance: {
    publicationAttempted: boolean;
    supplierSpendAttempted: boolean;
    birthTimestamp: string | null;
    thousandRelease: string;
  };
};

function Metric({
  field,
  tone = "neutral",
}: {
  field: MoneyField;
  tone?: "neutral" | "gold" | "warn";
}) {
  const valueClass =
    tone === "gold"
      ? "text-[#f0d78c]"
      : tone === "warn"
        ? "text-amber-200"
        : "text-[#e8e0d0]";
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-2 py-2">
      <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">{field.label}</p>
      <p className={`mt-1 text-sm font-medium ${valueClass}`}>{field.display}</p>
      <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#5a564e]">
        {field.status.replace(/_/g, " ")}
      </p>
    </div>
  );
}

/** CQ-04 — Pillow one-product commissioning dossier (not floating commerceOpportunity). */
export function OneProductDecisionDossierPanel({
  onAskPillow,
}: {
  onAskPillow: (prompt: string) => void;
}) {
  const [dossier, setDossier] = useState<DecisionDossier | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/pillow-commissioning/one-product/decision-dossier", {
        credentials: "include",
      });
      const json = (await res.json()) as {
        ok?: boolean;
        dossier?: DecisionDossier | null;
        error?: string;
      };
      if (!res.ok || !json.ok || !json.dossier) {
        setDossier(null);
        setError(json.error ?? "Commissioning dossier unavailable");
      } else {
        setDossier(json.dossier);
        setError(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dossier");
      setDossier(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading && !dossier) {
    return (
      <div className="h-40 animate-pulse rounded-xl border border-emerald-500/20 bg-emerald-500/[0.03]" />
    );
  }
  if (error && !dossier) {
    return (
      <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 px-5 py-4 text-sm text-[#c8c0b0]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-200">
          CQ-04 one-product dossier
        </p>
        <p className="mt-2">{error}</p>
        <p className="mt-2 text-xs text-[#8a847a]">
          Pillow must select via the production commissioning pipeline. Cursor will not choose a
          product.
        </p>
      </section>
    );
  }
  if (!dossier) return null;

  const expensive =
    dossier.prominentCompetitionRisk ||
    (dossier.economics.priceDifference.amountUsd != null &&
      dossier.economics.priceDifference.amountUsd > 0);

  return (
    <section
      id="one-product-decision-dossier"
      data-testid="one-product-decision-dossier"
      aria-label="Pillow one-product decision dossier"
      className="flex w-full flex-col rounded-xl border border-emerald-500/35 bg-emerald-500/[0.05]"
    >
      <header className="border-b border-emerald-500/20 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-emerald-200">
          Product decision dossier
        </p>
        <h3 className="mt-1 font-display text-xl text-[#f0d78c]">{dossier.product.plainName}</h3>
        <p className="mt-2 text-xs text-[#8a847a]">
          Selected by Pillow · Cursor did not choose this product
        </p>
      </header>

      <div className="grid gap-4 px-5 py-4 lg:grid-cols-[160px_minmax(0,1fr)]">
        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-gold/15 bg-black/40">
          {dossier.product.catalogImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={dossier.product.catalogImageUrl}
              alt={dossier.product.plainName}
              className="h-full w-full object-contain"
            />
          ) : (
            <p className="px-3 text-center text-xs text-[#6f6a60]">
              Product image not yet available
            </p>
          )}
        </div>
        <div className="space-y-3">
          <div className="rounded-lg border border-gold/20 bg-black/35 px-3 py-3">
            <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
              Pillow&apos;s recommendation
            </p>
            <p className="mt-1 text-lg text-[#d4af37]">
              {dossier.pillowRecommendation.verdict}
              {dossier.pillowRecommendation.confidence
                ? ` · confidence ${dossier.pillowRecommendation.confidence}`
                : ""}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-[#c8c0b0]">
              Why: {dossier.pillowRecommendation.why}
            </p>
          </div>
          <p className="text-xs text-[#8a847a]">
            {dossier.product.listingRouteExplanation}
          </p>
        </div>
      </div>

      <div className="space-y-3 border-t border-emerald-500/15 px-5 py-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric field={dossier.economics.ourPrice} tone="gold" />
          <Metric
            field={dossier.economics.lowestCompetitor}
            tone={expensive ? "warn" : "neutral"}
          />
          <Metric
            field={{
              ...dossier.economics.priceDifference,
              display: `${dossier.economics.priceDifference.display} (${dossier.economics.priceDifferencePct})`,
            }}
            tone={expensive ? "warn" : "neutral"}
          />
          <Metric field={dossier.economics.expectedProfit} tone="gold" />
        </div>
        {dossier.prominentCompetitionRisk && (
          <p className="rounded border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            {dossier.prominentCompetitionRisk}
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Metric field={dossier.supplier.supplierCost} />
          <Metric field={dossier.supplier.freight} />
          <Metric field={dossier.economics.amazonFees} />
          <Metric field={dossier.economics.breakEven} />
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">Demand</p>
            <p className="mt-1 text-xs text-amber-100">{dossier.demand.evidence}</p>
          </div>
          <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
            <p className="text-[9px] uppercase tracking-wider text-[#6f6a60]">Delivery</p>
            <p className="mt-1 text-xs text-[#c8c0b0]">{dossier.delivery.customerPromise}</p>
          </div>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">Key risks</p>
          <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-[#c8c0b0]">
            {dossier.risks.slice(0, 6).map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </div>
        {(dossier.pillowRecommendation.unsureAbout?.length ?? 0) > 0 && (
          <div>
            <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
              What Pillow is unsure about
            </p>
            <ul className="mt-1 list-disc space-y-1 pl-5 text-xs text-amber-100/90">
              {dossier.pillowRecommendation.unsureAbout!.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="space-y-3 border-t border-emerald-500/15 px-5 py-4">
        <details className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2">
          <summary className="cursor-pointer text-xs text-[#8a847a]">
            Candidate funnel &amp; alternatives ▸
          </summary>
          <p className="mt-2 text-xs text-[#c8c0b0]">
            Evaluated {dossier.funnel.candidatesEvaluated ?? "—"} · Rejected{" "}
            {dossier.funnel.rejectedBeforeDeepAnalysis ?? "—"} · Survivors{" "}
            {dossier.funnel.smartViableSurvivors ?? "—"}
          </p>
          <ul className="mt-2 space-y-1 text-xs text-[#8a847a]">
            {dossier.funnel.finalists.map((f) => (
              <li key={f.opportunityId ?? f.productName}>
                <span className="text-[#d4af37]">{f.role}</span> — {f.productName} ·{" "}
                {f.expectedProfit}
                {f.whyLost ? ` · ${f.whyLost}` : ""}
              </li>
            ))}
          </ul>
        </details>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 text-xs text-[#c8c0b0]">
            <p className="text-[#d4af37]">If you approve</p>
            <ol className="mt-1 list-decimal space-y-1 pl-4">
              {dossier.grandKingDecision.ifApprove.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ol>
          </div>
          <div className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2 text-xs text-[#c8c0b0]">
            <p className="text-[#d4af37]">If you reject</p>
            <ul className="mt-1 list-disc space-y-1 pl-4">
              {dossier.grandKingDecision.ifReject.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>

        <details className="rounded-lg border border-gold/10 bg-black/20 px-3 py-2">
          <summary className="cursor-pointer text-xs font-medium text-[#8a847a]">
            Technical appendix / evidence IDs
          </summary>
          <dl className="mt-2 space-y-1 font-mono text-[11px] text-[#6f6a60]">
            {Object.entries(dossier.technicalAppendix).map(([k, v]) => (
              <div key={k} className="flex flex-wrap gap-2">
                <dt className="min-w-[8rem] text-[#8a847a]">{k}</dt>
                <dd>{v ?? "—"}</dd>
              </div>
            ))}
          </dl>
          {dossier.unknownFields.length > 0 && (
            <p className="mt-2 text-[11px] text-[#8a847a]">
              Unknown fields: {dossier.unknownFields.join(", ")}
            </p>
          )}
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
            onClick={() => onAskPillow(dossier.challengeInterface.askPromptSeed)}
          >
            Ask Pillow about this dossier
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#c8c0b0] hover:border-gold/30"
            onClick={() =>
              onAskPillow(
                `${dossier.challengeInterface.askPromptSeed} Challenge: Why would a customer buy at our price versus the lowest competitor? What demand evidence do you actually have?`,
              )
            }
          >
            Challenge Pillow
          </button>
          <button
            type="button"
            className="rounded-lg border border-gold/15 px-3 py-2 text-xs text-[#8a847a] hover:border-gold/30"
            onClick={() => void load()}
          >
            Reload dossier
          </button>
        </div>
        <details className="text-[10px] text-[#6f6a60]">
          <summary className="cursor-pointer">Governance status ▸</summary>
          <p className="mt-1">
            Challenge gate: awaiting Grand King + ChatGPT. Publication attempted:{" "}
            {String(dossier.governance.publicationAttempted)} · Spend attempted:{" "}
            {String(dossier.governance.supplierSpendAttempted)} · Birth:{" "}
            {dossier.governance.birthTimestamp ?? "not authorised"} · 1,000 release: not released
          </p>
        </details>
      </footer>
    </section>
  );
}
