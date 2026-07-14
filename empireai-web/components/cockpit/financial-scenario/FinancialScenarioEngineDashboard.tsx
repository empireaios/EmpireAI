"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useFinancialScenarioEngine } from "@/lib/financial-scenario-engine/useFinancialScenarioEngine";

/** Compact Financial Scenario Engine strip for Executive Home. */
export function FinancialScenarioEngineStrip() {
  const { view, loading, live } = useFinancialScenarioEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Financial Scenario Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-09 Scenario</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/financial-scenario" className="text-xs text-[#d4af37] hover:underline">
          Scenario panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Scenarios</p>
          <p className="text-sm text-[#d4af37]">{view.activeScenarioCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-indigo-300">{view.projectedEnterpriseRevenue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Profit</p>
          <p className="text-sm text-[#e8e0d0]">{view.projectedEnterpriseProfit}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Confidence</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageConfidence}%</p>
        </div>
      </div>
    </section>
  );
}

/** E3-09 — Permanent Financial Scenario Engine panel. */
export function FinancialScenarioEngineDashboard() {
  const { view, loading, error, reload, live, data } = useFinancialScenarioEngine();

  if (loading && !view) {
    return <Panel title="Financial Scenario">Loading financial scenario engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Financial Scenario" subtitle="E3-09 · Financial Scenario Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-09 Financial Scenario Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE310 && (
            <Link href="/cockpit/founder/executive-kpi">
              <Badge variant="gold">E3-10 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/cost-optimization" className="text-xs text-[#d4af37] hover:underline">
            Cost Optimization →
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
        <StatCard label="Scenario Health" value={view.scenarioHealth} />
        <StatCard label="Projected Revenue" value={view.projectedEnterpriseRevenue} />
        <StatCard label="Projected Profit" value={view.projectedEnterpriseProfit} />
        <StatCard label="Cash Position" value={view.projectedCashPosition} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Avg Confidence" value={`${view.averageConfidence}%`} />
        <StatCard label="Avg Expected ROI" value={`${view.averageExpectedRoi}%`} />
      </div>

      <Panel title="Available Scenarios">
        <DataTable
          columns={[
            { key: "title", header: "Scenario" },
            { key: "category", header: "Category" },
            { key: "domain", header: "Domain" },
            { key: "projectedProfit", header: "Profit" },
            { key: "expectedRoi", header: "ROI" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.availableScenarios}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Revenue Forecast">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "bestCase", header: "Best" },
              { key: "expectedCase", header: "Expected" },
              { key: "worstCase", header: "Worst" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.revenueForecast}
          />
        </Panel>

        <Panel title="Profit Forecast">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "bestCase", header: "Best" },
              { key: "expectedCase", header: "Expected" },
              { key: "worstCase", header: "Worst" },
              { key: "margin", header: "Margin" },
            ]}
            rows={view.profitForecast}
          />
        </Panel>
      </div>

      <Panel title="Cash Flow Forecast">
        <DataTable
          columns={[
            { key: "period", header: "Period" },
            { key: "inflow", header: "Inflow" },
            { key: "outflow", header: "Outflow" },
            { key: "netCashFlow", header: "Net" },
            { key: "endingBalance", header: "Balance" },
            { key: "scenario", header: "Scenario" },
          ]}
          rows={view.cashFlowForecast}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="ROI Projections">
          <DataTable
            columns={[
              { key: "title", header: "Scenario" },
              { key: "expectedRoi", header: "ROI" },
              { key: "paybackPeriod", header: "Payback" },
              { key: "confidence", header: "Confidence" },
              { key: "status", header: "Status" },
            ]}
            rows={view.roiProjections}
          />
        </Panel>

        <Panel title="Scenario Comparison">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "bestCase", header: "Best" },
              { key: "expectedCase", header: "Expected" },
              { key: "worstCase", header: "Worst" },
              { key: "variance", header: "Variance" },
            ]}
            rows={view.scenarioComparison}
          />
        </Panel>
      </div>

      <Panel title="Financial Risks">
        <DataTable
          columns={[
            { key: "title", header: "Scenario" },
            { key: "severity", header: "Severity" },
            { key: "exposure", header: "Exposure" },
            { key: "mitigation", header: "Mitigation" },
            { key: "status", header: "Status" },
          ]}
          rows={view.financialRisks}
        />
      </Panel>

      <Panel title="Financial Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.financialAnalysis}
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

      <Panel title="Financial Scenario Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.financialScenarioPipeline}
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
