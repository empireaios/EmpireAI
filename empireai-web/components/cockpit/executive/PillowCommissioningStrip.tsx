"use client";

import { useEffect } from "react";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

function Cell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-1 text-sm text-[#e8e0d0]">{value}</p>
    </div>
  );
}

/** Mission 004 — operating state, since-last-visit, birth, cost, Flight Recorder. */
export function PillowCommissioningStrip() {
  const { data, loading } = useExecutiveHome();
  const t = data?.canonicalTruth;

  useEffect(() => {
    // Record Grand King visit once per shell mount — deltas use previous clock.
    void fetch("/api/pillow-commissioning/visit", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: "{}",
    }).catch(() => undefined);
  }, []);

  if (loading && !t) {
    return <div className="h-28 animate-pulse rounded-xl border border-gold/10 bg-white/[0.02]" />;
  }
  if (!t) return null;

  const op = t.pillowOperatingState;
  const visit = t.sinceLastVisit;
  const birth = t.birth;
  const cost = t.costGuard;
  const opc = t.oneProductCommissioning;
  const kpi = t.smartViableKpi;
  const flights = t.flightRecorderLatest ?? [];

  return (
    <section
      aria-label="Pillow commissioning observability"
      className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
          Pillow · observability & commissioning
        </p>
        <DataModeBadge mode="live" />
      </div>

      {op?.winningOperatingQuestion && (
        <p className="mb-3 text-sm leading-relaxed text-[#c8c0b0]">
          <span className="text-[#d4af37]">Winning purpose · </span>
          {op.winningOperatingQuestion}
          {op.activityMode ? (
            <span className="text-[#8a847a]"> · mode {op.activityMode.replace(/_/g, " ")}</span>
          ) : null}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Cell label="Operating state" value={op?.humanLabel ?? "UNKNOWN"} />
        <Cell label="Current focus" value={op?.currentFocus ?? "—"} />
        <Cell
          label="Birth"
          value={
            birth?.birthTimestamp
              ? `Born ${birth.birthTimestamp}`
              : birth?.status === "TECHNICALLY_READY_AWAITING_GRAND_KING"
                ? "Technically ready — awaiting Grand King"
                : birth?.status ?? "Not ready"
          }
        />
        <Cell
          label="Operating age"
          value={
            birth?.operatingAgeSeconds != null
              ? `${Math.floor(birth.operatingAgeSeconds / 3600)}h`
              : "—"
          }
        />
        <Cell label="Cost Guard" value={cost?.level ?? "—"} />
        <Cell
          label="Spend Actual / Committed / Forecast"
          value={
            cost
              ? `$${cost.actualUsd.toFixed(2)} / $${cost.committedUsd.toFixed(2)} / $${cost.forecastUsd.toFixed(2)}`
              : "—"
          }
        />
        <Cell
          label="SMART viable / 1,000"
          value={kpi ? `${kpi.smartViable} / ${kpi.target} (−${kpi.distanceToTarget})` : "—"}
        />
        <Cell
          label="Needs Grand King"
          value={
            op?.needsGrandKing
              ? op.needsGrandKingReason ?? "Yes"
              : visit?.needsGrandKing
                ? visit.needsGrandKingReason ?? "Yes"
                : "No"
          }
        />
      </div>

      {visit && (
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <Cell label="Since last visit · discovered" value={String(visit.discovered)} />
          <Cell label="Analysed" value={String(visit.analysed)} />
          <Cell label="Rejected" value={String(visit.rejected)} />
          <Cell label="Approvals requested" value={String(visit.approvalsRequested)} />
          <Cell label="Purchases made" value={String(visit.purchasesMade)} />
          <Cell label="AI/API cost (ledger)" value={`$${visit.aiApiCostIncurredUsd.toFixed(4)}`} />
        </div>
      )}

      {opc && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-[#c8c0b0]">
          <span className="text-emerald-200">One-product commissioning · Pillow-selected · </span>
          {opc.productName} · {opc.marketplace} via {opc.supplier} · expected{" "}
          {opc.expectedProfit} · stage {opc.stage} · BUYABLE {String(opc.buyable)} · GK{" "}
          {opc.grandKingDecision}
          <details className="mt-1 text-xs text-[#6f6a60]">
            <summary className="cursor-pointer text-[#8a847a]">Technical details</summary>
            <p className="mt-1">
              selectionAuthority=pillow · cursorSelected=false · visual {opc.visualRoute}
            </p>
          </details>
        </div>
      )}

      {flights.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">Flight Recorder</p>
          <ul className="mt-1 space-y-1 text-xs text-[#c8c0b0]">
            {flights.map((f) => (
              <li key={`${f.at}-${f.type}-${f.summary}`}>
                <span className="text-[#8a847a]">{f.at}</span> · {f.type} · {f.summary}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[#6f6a60]">
        Next work: {visit?.nextWork ?? op?.currentFocus ?? "—"} · Cost Centre: /cockpit/finance/costs
      </p>
    </section>
  );
}
