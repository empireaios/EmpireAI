"use client";

import { useCallback, useEffect, useState } from "react";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";

type CostControlSnapshot = {
  computedAt: string;
  reportingCurrency: "USD";
  costGuard: {
    level: string;
    hardStopActive: boolean;
    unconfiguredLimitKeys: string[];
    hardStopReasons: string[];
    spend: {
      dailyAi: { actualUsd: number; committedUsd: number; forecastUsd: number };
      monthlyOperating: { actualUsd: number; committedUsd: number; forecastUsd: number };
      autonomousPaid: { actualUsd: number; committedUsd: number; forecastUsd: number };
    };
    limits: Record<string, number | null | string>;
  };
  providers: Array<{
    provider: string;
    service: string;
    status: string;
    plan: string | null;
    billingModel: string;
    todayUsd: number | "UNKNOWN" | null;
    thisMonthUsd: number | "UNKNOWN" | null;
    forecastMonthEndUsd: number | "UNKNOWN" | null;
    budgetLimitUsd: number | null;
    pctConsumed: number | null;
    lastRefreshed: string;
    costDataSource: string;
    confidence: string;
    billingBlindSpot: boolean;
  }>;
  billingExposure: Array<{
    provider: string;
    service: string;
    paymentExposure: string;
    knownMaxExposureUsd: number | null | "UNKNOWN";
    unexpectedChargeRisk: string;
    notes: string;
  }>;
  actualVsCommittedVsForecast: {
    actualUsd: number;
    committedUsd: number;
    forecastUsd: number;
    note: string;
  };
  scaleForecast: {
    basis: string;
    confidence: string;
    scenarios: Record<string, number | null>;
    notes: string[];
  };
  blindSpots: string[];
};

function money(v: number | "UNKNOWN" | null | undefined): string {
  if (v == null) return "—";
  if (v === "UNKNOWN") return "UNKNOWN";
  return `$${v.toFixed(4)}`;
}

export function CostControlCentrePanel() {
  const [data, setData] = useState<CostControlSnapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [proof, setProof] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch("/api/pillow-commissioning/cost-control", {
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) throw new Error(`Cost Control unavailable (${res.status})`);
      setData((await res.json()) as CostControlSnapshot);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load Cost Control Centre");
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function runHardStopProof() {
    setBusy(true);
    setProof(null);
    try {
      const res = await fetch("/api/pillow-commissioning/cost-guard/hard-stop-proof", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: "{}",
      });
      const body = (await res.json()) as { ok?: boolean; detail?: string; error?: string };
      setProof(body.detail ?? body.error ?? (body.ok ? "PASS" : "FAIL"));
      await load();
    } catch (e) {
      setProof(e instanceof Error ? e.message : "Hard-stop proof failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-widest text-[#6f6a60]">
            Finance · Cost Control Centre
          </p>
          <h1 className="font-display text-2xl text-[#f0d78c]">Cost Control Centre</h1>
          <p className="text-sm text-[#8a847a]">
            ACTUAL ≠ COMMITTED ≠ FORECAST · UNKNOWN remains UNKNOWN · Cost Guard enforcement
          </p>
        </div>
        <DataModeBadge mode="live" />
      </header>

      {error && (
        <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-sm text-amber-100">
          {error}
        </p>
      )}

      {data && (
        <>
          <section className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Metric label="Cost Guard" value={data.costGuard.level} />
            <Metric
              label="Hard stop"
              value={data.costGuard.hardStopActive ? "ACTIVE" : "Inactive"}
            />
            <Metric label="Actual (ledger)" value={money(data.actualVsCommittedVsForecast.actualUsd)} />
            <Metric
              label="Committed"
              value={money(data.actualVsCommittedVsForecast.committedUsd)}
            />
            <Metric
              label="Forecast"
              value={money(data.actualVsCommittedVsForecast.forecastUsd)}
            />
            <Metric
              label="Unconfigured limits"
              value={String(data.costGuard.unconfiguredLimitKeys.length)}
            />
            <Metric label="Scale forecast basis" value={data.scaleForecast.basis} />
            <Metric label="Forecast confidence" value={data.scaleForecast.confidence} />
          </section>

          <p className="text-xs text-[#6f6a60]">{data.actualVsCommittedVsForecast.note}</p>

          {data.costGuard.unconfiguredLimitKeys.length > 0 && (
            <section className="rounded-xl border border-gold/20 bg-white/[0.02] px-4 py-3">
              <h2 className="text-sm text-[#f0d78c]">Owner limits awaiting Grand King</h2>
              <p className="mt-1 text-xs text-[#8a847a]">
                Pillow will not invent budgets. Configure via API{" "}
                <code className="text-[#c8c0b0]">POST /api/pillow-commissioning/cost-guard/limits</code>
                .
              </p>
              <ul className="mt-2 list-disc pl-5 text-sm text-[#c8c0b0]">
                {data.costGuard.unconfiguredLimitKeys.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </section>
          )}

          <section className="overflow-x-auto rounded-xl border border-gold/15">
            <table className="min-w-full text-left text-sm text-[#c8c0b0]">
              <thead className="bg-black/40 text-[10px] uppercase tracking-wider text-[#6f6a60]">
                <tr>
                  <th className="px-3 py-2">Provider</th>
                  <th className="px-3 py-2">Service</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Billing</th>
                  <th className="px-3 py-2">Today</th>
                  <th className="px-3 py-2">Month</th>
                  <th className="px-3 py-2">Forecast</th>
                  <th className="px-3 py-2">Limit</th>
                  <th className="px-3 py-2">%</th>
                  <th className="px-3 py-2">Source</th>
                  <th className="px-3 py-2">Blind spot</th>
                </tr>
              </thead>
              <tbody>
                {data.providers.map((p) => (
                  <tr key={`${p.provider}-${p.service}`} className="border-t border-gold/10">
                    <td className="px-3 py-2">{p.provider}</td>
                    <td className="px-3 py-2">{p.service}</td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2">{p.billingModel}</td>
                    <td className="px-3 py-2">{money(p.todayUsd)}</td>
                    <td className="px-3 py-2">{money(p.thisMonthUsd)}</td>
                    <td className="px-3 py-2">{money(p.forecastMonthEndUsd)}</td>
                    <td className="px-3 py-2">{money(p.budgetLimitUsd)}</td>
                    <td className="px-3 py-2">{p.pctConsumed == null ? "—" : `${p.pctConsumed}%`}</td>
                    <td className="px-3 py-2 text-xs">{p.costDataSource}</td>
                    <td className="px-3 py-2">{p.billingBlindSpot ? "YES" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3">
            <h2 className="text-sm text-[#f0d78c]">Billing exposure register</h2>
            <ul className="mt-2 space-y-2 text-sm text-[#c8c0b0]">
              {data.billingExposure.map((row) => (
                <li key={`${row.provider}-${row.service}`}>
                  <span className="text-[#e8e0d0]">{row.provider}</span> · {row.service} · risk{" "}
                  {row.unexpectedChargeRisk} · max {String(row.knownMaxExposureUsd)} ·{" "}
                  {row.paymentExposure}
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3">
            <h2 className="text-sm text-[#f0d78c]">Scale forecast</h2>
            <p className="mt-1 text-xs text-[#8a847a]">{data.scaleForecast.notes.join(" ")}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5">
              {Object.entries(data.scaleForecast.scenarios).map(([k, v]) => (
                <Metric key={k} label={`${k} units`} value={v == null ? "INSUFFICIENT" : money(v)} />
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3">
            <h2 className="text-sm text-[#f0d78c]">Blind spots</h2>
            <ul className="mt-2 list-disc pl-5 text-sm text-[#c8c0b0]">
              {data.blindSpots.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          </section>

          <section className="rounded-xl border border-gold/15 bg-white/[0.02] px-4 py-3">
            <h2 className="text-sm text-[#f0d78c]">Safe hard-stop proof</h2>
            <p className="mt-1 text-xs text-[#8a847a]">
              Applies a temporary micro-limit, verifies paid autonomous activity is blocked, then
              restores prior limits. Does not cause uncontrolled spend.
            </p>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runHardStopProof()}
              className="mt-3 rounded-lg border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-[#f0d78c] disabled:opacity-50"
            >
              {busy ? "Running…" : "Run safe hard-stop proof"}
            </button>
            {proof && <p className="mt-2 text-sm text-[#c8c0b0]">{proof}</p>}
          </section>

          <p className="text-[10px] text-[#6f6a60]">Refreshed {data.computedAt}</p>
        </>
      )}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-black/25 px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-[#6f6a60]">{label}</p>
      <p className="mt-1 text-sm text-[#e8e0d0]">{value}</p>
    </div>
  );
}
