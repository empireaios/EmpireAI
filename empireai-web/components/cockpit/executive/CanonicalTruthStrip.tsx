"use client";

import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import {
  formatFinancialAmount,
  scrubMachineLanguage,
} from "@/lib/cockpit/executive/executive-presentation";

function TruthCell({
  label,
  value,
  status,
}: {
  label: string;
  value: string;
  status?: string;
}) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-1 text-sm text-[#e8e0d0]">{value}</p>
      {status ? (
        <p className="mt-0.5 text-[9px] uppercase tracking-wider text-[#5a564e]">{status}</p>
      ) : null}
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

  const revenue = formatFinancialAmount(t.realisedRevenueUsd, {
    status: t.realisedRevenueUsd == null ? "NOT_YET_VERIFIED" : "VERIFIED_LIVE",
    source: "canonical-executive-truth / commerce ledger",
    currency: "USD",
    coverage: "realised marketplace orders only — not expected profit",
  });
  const profit = formatFinancialAmount(t.realisedProfitUsd, {
    status: t.realisedProfitUsd == null ? "NOT_YET_VERIFIED" : "VERIFIED_LIVE",
    source: "canonical-executive-truth / commerce ledger",
    currency: "USD",
    coverage: "realised profit only — not projected margin",
  });

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
        <TruthCell label="Brain" value={scrubMachineLanguage(t.brainStatus)} />
        <TruthCell label="Guardian" value={scrubMachineLanguage(t.guardianStatus)} />
        <TruthCell label="Production" value={scrubMachineLanguage(t.productionStatus)} />
        <TruthCell label="Mission" value={scrubMachineLanguage(t.activeMissionHuman)} />
        <TruthCell label="Pending approvals" value={String(t.pendingApprovals)} />
        <TruthCell
          label="Realised revenue"
          value={
            t.realisedRevenueUsd == null || t.realisedRevenueUsd === 0
              ? "No realised revenue yet"
              : revenue.display
          }
          status={revenue.label}
        />
        <TruthCell
          label="Realised profit"
          value={
            t.realisedProfitUsd == null || t.realisedProfitUsd === 0
              ? "No realised profit yet"
              : profit.display
          }
          status={profit.label}
        />
        <TruthCell
          label="Orders"
          value={t.realisedOrders == null || t.realisedOrders === 0 ? "No orders received" : String(t.realisedOrders)}
          status={t.realisedOrders == null ? "not yet verified" : "verified live"}
        />
      </div>
      {t.commerceOpportunity && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-[#c8c0b0]">
          <span className="text-emerald-200">Commerce opportunity · approval required · </span>
          {t.commerceOpportunity.productName} · expected profit{" "}
          {t.commerceOpportunity.expectedProfitUsd}{" "}
          <span className="text-[10px] uppercase tracking-wider text-[#5a564e]">
            estimated — not realised
          </span>
          <details className="mt-1 text-xs text-[#6f6a60]">
            <summary className="cursor-pointer text-[#8a847a]">Technical details</summary>
            <p className="mt-1 font-mono">
              ASIN {t.commerceOpportunity.asin} · SKU {t.commerceOpportunity.amazonSellerSku}
              {"cjPid" in t.commerceOpportunity && t.commerceOpportunity.cjPid
                ? ` · CJ ${String(t.commerceOpportunity.cjPid)}`
                : ""}
            </p>
          </details>
        </div>
      )}
      <p className="mt-2 text-[10px] text-[#6f6a60]">
        Seed portfolio GMV / demo margins are excluded from LIVE realised economics. Expected
        figures are never labelled realised.
      </p>
    </section>
  );
}
