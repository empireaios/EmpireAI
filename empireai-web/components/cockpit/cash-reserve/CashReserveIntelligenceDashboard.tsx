"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCashReserveIntelligence } from "@/lib/cash-reserve-intelligence/useCashReserveIntelligence";

/** Compact Cash Reserve Intelligence strip for Executive Home. */
export function CashReserveIntelligenceStrip() {
  const { view, loading, live } = useCashReserveIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Cash Reserve Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-06 Cash</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/cash-reserve" className="text-xs text-[#d4af37] hover:underline">
          Cash panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Cash Position</p>
          <p className="text-sm text-[#d4af37]">{view.totalCashPosition}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Liquidity</p>
          <p className="text-sm text-sky-300">{view.liquidityStatus}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Coverage</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageCoverageMonths} mo</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Burn Rate</p>
          <p className="text-sm text-[#e8e0d0]">{view.cashBurnRate}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-06 — Permanent Cash Reserve Intelligence panel. */
export function CashReserveIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useCashReserveIntelligence();

  if (loading && !view) {
    return <Panel title="Cash Reserve">Loading cash reserve intelligence…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Cash Reserve" subtitle="E3-06 · Cash Reserve Intelligence">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-06 Cash Reserve Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE307 && (
            <Link href="/cockpit/founder/profit-optimization">
              <Badge variant="gold">E3-07 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/roi-intelligence" className="text-xs text-[#d4af37] hover:underline">
            ROI Intelligence →
          </Link>
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.intelligenceSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Liquidity Health" value={view.liquidityHealth} />
        <StatCard label="Cash Position" value={view.totalCashPosition} />
        <StatCard label="Available Liquidity" value={view.availableLiquidity} />
        <StatCard label="Reserve Balance" value={view.totalReserveBalance} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Coverage Period" value={`${view.averageCoverageMonths} months`} />
        <StatCard label="Financial Stability" value={`${view.financialStabilityScore}/100`} />
      </div>

      <Panel title="Current Cash Position">
        <DataTable
          columns={[
            { key: "label", header: "Position" },
            { key: "balance", header: "Balance" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.cashPosition}
        />
      </Panel>

      <Panel title="Reserve Levels">
        <DataTable
          columns={[
            { key: "title", header: "Reserve" },
            { key: "category", header: "Category" },
            { key: "currentBalance", header: "Current" },
            { key: "targetReserve", header: "Target" },
            { key: "utilization", header: "Utilization %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.reserveLevels}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Liquidity Status">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.liquidityStatusMetrics}
          />
        </Panel>

        <Panel title="Cash Flow Forecast">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "inflow", header: "Inflow" },
              { key: "outflow", header: "Outflow" },
              { key: "netCashFlow", header: "Net" },
              { key: "endingBalance", header: "Ending Balance" },
              { key: "status", header: "Status" },
            ]}
            rows={view.cashFlowForecast}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Liquidity Risks">
          <DataTable
            columns={[
              { key: "title", header: "Reserve" },
              { key: "severity", header: "Severity" },
              { key: "exposure", header: "Exposure" },
              { key: "mitigation", header: "Mitigation" },
              { key: "status", header: "Status" },
            ]}
            rows={view.liquidityRisks}
          />
        </Panel>

        <Panel title="Financial Stability">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.financialStability}
          />
        </Panel>
      </div>

      <Panel title="Cash Reserves">
        <DataTable
          columns={[
            { key: "title", header: "Reserve" },
            { key: "category", header: "Category" },
            { key: "currentBalance", header: "Balance" },
            { key: "coveragePeriod", header: "Coverage" },
            { key: "projectedCashFlow", header: "Projected Flow" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.cashReserves.map((r) => ({
            ...r,
            category: r.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Liquidity Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.liquidityAnalysis}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "what", header: "What" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Cash Reserve Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.cashReservePipeline}
        />
      </Panel>

      <Panel title="Pillow Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>

      <Panel title="Integrations">
        <DataTable
          columns={[
            { key: "engine", header: "Engine" },
            { key: "status", header: "Status" },
          ]}
          rows={Object.entries(view.integrations).map(([engine, status]) => ({ engine, status }))}
        />
      </Panel>
    </div>
  );
}
