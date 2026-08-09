"use client";

import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

function TruthCell({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-1 text-sm text-[#e8e0d0]">{value}</p>
    </div>
  );
}

/** LIVE economics + health from canonical truth only (never seed GMV). */
export function CanonicalTruthStrip() {
  const { data, loading } = useExecutiveHome();
  const t = data?.canonicalTruth;

  if (loading && !t) {
    return <div className="h-24 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }
  if (!t) return null;

  const money = (n: number | null, empty: string) =>
    n == null ? empty : `$${n.toFixed(2)}`;

  return (
    <section
      aria-label="Canonical executive truth"
      className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
          Current operational truth
        </p>
        <DataModeBadge mode="live" />
      </div>
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <TruthCell label="Brain" value={t.brainStatus} />
        <TruthCell label="Guardian" value={t.guardianStatus} />
        <TruthCell label="Production" value={t.productionStatus} />
        <TruthCell label="Mission" value={t.activeMissionHuman} />
        <TruthCell label="Pending approvals" value={String(t.pendingApprovals)} />
        <TruthCell label="Realised revenue" value={money(t.realisedRevenueUsd, "No realised revenue yet")} />
        <TruthCell label="Realised profit" value={money(t.realisedProfitUsd, "No realised profit yet")} />
        <TruthCell label="Orders" value={t.realisedOrders == null ? "No orders received" : String(t.realisedOrders)} />
      </div>
      {t.commerceOpportunity && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-[#c8c0b0]">
          <span className="text-emerald-200">Commerce opportunity · APPROVAL REQUIRED · </span>
          {t.commerceOpportunity.productName} · ASIN {t.commerceOpportunity.asin} ·{" "}
          {t.commerceOpportunity.expectedProfitUsd} expected profit · SKU{" "}
          {t.commerceOpportunity.amazonSellerSku}
        </div>
      )}
      <p className="mt-2 text-[10px] text-[#6f6a60]">
        Seed portfolio GMV / demo margins are excluded from LIVE realised economics.
      </p>
    </section>
  );
}
