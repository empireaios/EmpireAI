"use client";

import { useEffect } from "react";
import { useExecutiveHome } from "@/lib/cockpit/hooks/useExecutiveHome";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import {
  formatGrandKingTime,
  humanizeOperatingTerm,
  scrubMachineLanguage,
} from "@/lib/cockpit/executive/executive-presentation";

function Cell({
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

/** Mission 007 — natural-language Pillow footprint / status. */
export function PillowCommissioningStrip() {
  const { data, loading } = useExecutiveHome();
  const t = data?.canonicalTruth;

  useEffect(() => {
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

  const birthLabel = birth?.birthTimestamp
    ? `Started ${formatGrandKingTime(birth.birthTimestamp)}`
    : "Not yet started — continuous operation awaits your Birth authorisation";

  const operatingAge =
    birth?.operatingAgeSeconds != null
      ? `${Math.floor(birth.operatingAgeSeconds / 3600)} hours since continuous operation began`
      : "Not yet started";

  return (
    <section
      aria-label="Pillow operating status"
      className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#d4af37]">
          What is Pillow doing?
        </p>
        <DataModeBadge mode="live" />
      </div>

      {op?.winningOperatingQuestion && (
        <p className="mb-3 text-sm leading-relaxed text-[#c8c0b0]">
          <span className="text-[#d4af37]">Winning purpose · </span>
          {op.winningOperatingQuestion}
          {op.activityMode ? (
            <span className="text-[#8a847a]">
              {" "}
              · {humanizeOperatingTerm(op.activityMode)}
            </span>
          ) : null}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4 xl:grid-cols-8">
        <Cell
          label="Status"
          value={scrubMachineLanguage(op?.humanLabel ?? "Unknown")}
        />
        <Cell
          label="Current focus"
          value={scrubMachineLanguage(op?.currentFocus ?? "—")}
        />
        <Cell label="Continuous operation" value={birthLabel} />
        <Cell label="Time operating" value={operatingAge} />
        <Cell label="Cost Guard" value={cost?.level ?? "—"} />
        <Cell
          label="Spend (ledger)"
          value={
            cost
              ? `$${cost.actualUsd.toFixed(2)} actual · $${cost.committedUsd.toFixed(2)} committed · $${cost.forecastUsd.toFixed(2)} forecast`
              : "—"
          }
          status="PARTIAL — ledger, not invoice truth"
        />
        <Cell
          label="Commercially ready / 1,000"
          value={kpi ? `${kpi.smartViable} / ${kpi.target} (${kpi.distanceToTarget} to go)` : "—"}
          status="PIPELINE"
        />
        <Cell
          label="Needs you?"
          value={
            op?.needsGrandKing
              ? scrubMachineLanguage(op.needsGrandKingReason ?? "Yes")
              : visit?.needsGrandKing
                ? scrubMachineLanguage(visit.needsGrandKingReason ?? "Yes")
                : "No"
          }
        />
      </div>

      {visit && (
        <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-6">
          <Cell label="Since last visit · examined" value={String(visit.discovered)} />
          <Cell label="Analysed" value={String(visit.analysed)} />
          <Cell label="Rejected" value={String(visit.rejected)} />
          <Cell label="Approvals requested" value={String(visit.approvalsRequested)} />
          <Cell label="Purchases" value={String(visit.purchasesMade)} />
          <Cell
            label="AI/API cost (ledger)"
            value={`$${visit.aiApiCostIncurredUsd.toFixed(4)}`}
            status="PARTIAL"
          />
        </div>
      )}

      {kpi?.topRejectionReasons && kpi.topRejectionReasons.length > 0 && (
        <div className="mt-3 rounded-lg border border-gold/10 bg-black/20 px-3 py-2">
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
            Why products were rejected ({kpi.rejected})
          </p>
          <ul className="mt-1 space-y-1 text-xs text-[#c8c0b0]">
            {kpi.topRejectionReasons.slice(0, 6).map((r) => (
              <li key={r.reasonCode}>
                <span className="text-[#d4af37]">{r.count}</span>
                {" — "}
                {scrubMachineLanguage(r.humanLabel || r.reasonCode)}
              </li>
            ))}
          </ul>
          <details className="mt-1 text-[10px] text-[#5a564e]">
            <summary className="cursor-pointer">Technical reason codes</summary>
            <ul className="mt-1 space-y-1 font-mono">
              {kpi.topRejectionReasons.map((r) => (
                <li key={`tech-${r.reasonCode}`}>
                  {r.reasonCode}: {r.count}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      {opc && (
        <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-sm text-[#c8c0b0]">
          <span className="text-emerald-200">One-product test · Pillow-selected · </span>
          {opc.productName} via {opc.supplier} for {opc.marketplace} · expected{" "}
          {opc.expectedProfit} (expected — not realised) ·{" "}
          {scrubMachineLanguage(opc.stage)} · buyable status {String(opc.buyable)} · your
          decision {opc.grandKingDecision}
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
          <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">
            Recent meaningful activity
          </p>
          <ul className="mt-1 space-y-1 text-xs text-[#c8c0b0]">
            {flights.slice(0, 5).map((f) => (
              <li key={`${f.at}-${f.type}-${f.summary}`}>
                <span className="text-[#8a847a]">{formatGrandKingTime(f.at, { relative: true })}</span>
                {" · "}
                {scrubMachineLanguage(f.summary || f.type)}
              </li>
            ))}
          </ul>
          <details className="mt-1 text-[10px] text-[#5a564e]">
            <summary className="cursor-pointer">Technical activity log</summary>
            <ul className="mt-1 space-y-1 font-mono">
              {flights.map((f) => (
                <li key={`tech-${f.at}-${f.type}`}>
                  {f.at} · {f.type} · {f.summary}
                </li>
              ))}
            </ul>
          </details>
        </div>
      )}

      <p className="mt-2 text-[10px] text-[#6f6a60]">
        Next: {scrubMachineLanguage(visit?.nextWork ?? op?.currentFocus ?? "—")} · Cost Centre:
        /cockpit/finance/costs
      </p>
    </section>
  );
}
