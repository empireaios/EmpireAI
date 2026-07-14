"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveForecastIntelligence } from "@/lib/executive-forecast-intelligence/useExecutiveForecastIntelligence";

/** Compact Executive Forecast Intelligence strip for Executive Home. */
export function ExecutiveForecastIntelligenceStrip() {
  const { view, loading, live } = useExecutiveForecastIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Forecast Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-12 Forecast</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-forecast" className="text-xs text-[#d4af37] hover:underline">
          Forecast panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Proj. Revenue</p>
          <p className="text-sm text-[#d4af37]">{view.projectedEnterpriseRevenue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Proj. Profit</p>
          <p className="text-sm text-sky-300">{view.projectedEnterpriseProfit}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Accuracy</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageForecastAccuracy}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageConfidence}%</p>
        </div>
      </div>
    </section>
  );
}

/** E3-12 — Permanent Executive Forecast Intelligence panel. */
export function ExecutiveForecastIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveForecastIntelligence();

  if (loading && !view) {
    return <Panel title="Executive Forecast">Loading executive forecast intelligence…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Forecast" subtitle="E3-12 · Executive Forecast Intelligence">
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
          <Badge variant="gold">E3-12 Executive Forecast Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE313 && (
            <Link href="/cockpit/founder/executive-performance">
              <Badge variant="gold">E3-13 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/capital-risk" className="text-xs text-[#d4af37] hover:underline">
            Capital Risk →
          </Link>
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Forecast Health" value={view.forecastHealth} />
        <StatCard label="Projected Revenue" value={view.projectedEnterpriseRevenue} />
        <StatCard label="Projected Profit" value={view.projectedEnterpriseProfit} />
        <StatCard label="Cash Position" value={view.projectedCashPosition} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Avg Confidence" value={`${view.averageConfidence}%`} />
        <StatCard label="Forecast Accuracy" value={`${view.averageForecastAccuracy}%`} />
      </div>

      <Panel title="Revenue Forecast">
        <DataTable
          columns={[
            { key: "period", header: "Period" },
            { key: "projected", header: "Projected" },
            { key: "priorActual", header: "Prior Actual" },
            { key: "growth", header: "Growth" },
            { key: "confidence", header: "Confidence" },
            { key: "trend", header: "Trend" },
          ]}
          rows={view.revenueForecast}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profit Forecast">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "projected", header: "Projected" },
              { key: "margin", header: "Margin" },
              { key: "priorActual", header: "Prior Actual" },
              { key: "growth", header: "Growth" },
              { key: "confidence", header: "Confidence" },
            ]}
            rows={view.profitForecast}
          />
        </Panel>

        <Panel title="Cash Flow Forecast">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "inflow", header: "Inflow" },
              { key: "outflow", header: "Outflow" },
              { key: "netCashFlow", header: "Net" },
              { key: "endingBalance", header: "Balance" },
              { key: "confidence", header: "Confidence" },
            ]}
            rows={view.cashFlowForecast}
          />
        </Panel>
      </div>

      <Panel title="Growth Forecast">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "currentValue", header: "Current" },
            { key: "projectedValue", header: "Projected" },
            { key: "growthRate", header: "Growth" },
            { key: "confidence", header: "Confidence" },
            { key: "horizon", header: "Horizon" },
          ]}
          rows={view.growthForecast}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Forecast Accuracy">
          <DataTable
            columns={[
              { key: "title", header: "Forecast" },
              { key: "period", header: "Period" },
              { key: "projected", header: "Projected" },
              { key: "actual", header: "Actual" },
              { key: "variance", header: "Variance" },
              { key: "accuracyPercent", header: "Accuracy %" },
            ]}
            rows={view.forecastAccuracy}
          />
        </Panel>

        <Panel title="Financial Trends">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "current", header: "Current" },
              { key: "trend", header: "Trend" },
              { key: "forecast", header: "Forecast" },
              { key: "direction", header: "Direction" },
              { key: "confidence", header: "Confidence" },
            ]}
            rows={view.financialTrends}
          />
        </Panel>
      </div>

      <Panel title="Strategic Outlook">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "outlook", header: "Outlook" },
            { key: "horizon", header: "Horizon" },
            { key: "confidence", header: "Confidence" },
            { key: "riskFactor", header: "Risk" },
            { key: "status", header: "Status" },
          ]}
          rows={view.strategicOutlook}
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

      <Panel title="Forecast Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.forecastAnalysis}
        />
      </Panel>

      <Panel title="Executive Forecast Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveForecastPipeline}
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
