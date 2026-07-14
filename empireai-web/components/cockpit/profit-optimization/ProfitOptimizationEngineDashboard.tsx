"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useProfitOptimizationEngine } from "@/lib/profit-optimization-engine/useProfitOptimizationEngine";

/** Compact Profit Optimization Engine strip for Executive Home. */
export function ProfitOptimizationEngineStrip() {
  const { view, loading, live } = useProfitOptimizationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Profit Optimization Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-lime-500/40 bg-gradient-to-r from-lime-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-07 Profit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/profit-optimization" className="text-xs text-[#d4af37] hover:underline">
          Profit panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Net Profit</p>
          <p className="text-sm text-[#d4af37]">{view.totalNetProfit}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Net Margin</p>
          <p className="text-sm text-lime-300">{view.netMarginPercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Gross Margin</p>
          <p className="text-sm text-[#e8e0d0]">{view.grossMarginPercentage}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth</p>
          <p className="text-sm text-[#e8e0d0]">+{view.profitGrowthRate}%</p>
        </div>
      </div>
    </section>
  );
}

/** E3-07 — Permanent Profit Optimization Engine panel. */
export function ProfitOptimizationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useProfitOptimizationEngine();

  if (loading && !view) {
    return <Panel title="Profit Optimization">Loading profit optimization engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Profit Optimization" subtitle="E3-07 · Profit Optimization Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-lime-500/50 bg-gradient-to-br from-lime-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-07 Profit Optimization Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE308 && (
            <Link href="/cockpit/founder/cost-optimization">
              <Badge variant="gold">E3-08 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/cash-reserve" className="text-xs text-[#d4af37] hover:underline">
            Cash Reserve →
          </Link>
          <Link href="/cockpit/founder/roi-intelligence" className="text-xs text-[#d4af37] hover:underline">
            ROI Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Profit Health" value={view.profitHealth} />
        <StatCard label="Net Profit" value={view.totalNetProfit} />
        <StatCard label="Gross Margin" value={`${view.grossMarginPercentage}%`} />
        <StatCard label="Net Margin" value={`${view.netMarginPercentage}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Operating Margin" value={`${view.operatingMarginPercentage}%`} />
        <StatCard label="Profit Growth" value={`+${view.profitGrowthRate}% YoY`} />
      </div>

      <Panel title="Enterprise Profit">
        <DataTable
          columns={[
            { key: "title", header: "Assessment" },
            { key: "category", header: "Category" },
            { key: "netProfit", header: "Net Profit" },
            { key: "profitMargin", header: "Margin %" },
            { key: "expectedGrowth", header: "Growth" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseProfit}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profit Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "enterpriseProfit", header: "Profit" },
              { key: "grossMargin", header: "Gross %" },
              { key: "netMargin", header: "Net %" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.profitTrends}
          />
        </Panel>

        <Panel title="Financial Performance">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.financialPerformance}
          />
        </Panel>
      </div>

      <Panel title="Optimization Opportunities">
        <DataTable
          columns={[
            { key: "title", header: "Opportunity" },
            { key: "capability", header: "Capability" },
            { key: "impact", header: "Impact" },
            { key: "estimatedGain", header: "Est. Gain" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status" },
          ]}
          rows={view.optimizationOpportunities.map((o) => ({
            ...o,
            capability: o.capability.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Profit Risks">
          <DataTable
            columns={[
              { key: "title", header: "Assessment" },
              { key: "severity", header: "Severity" },
              { key: "exposure", header: "Exposure" },
              { key: "mitigation", header: "Mitigation" },
              { key: "status", header: "Status" },
            ]}
            rows={view.profitRisks}
          />
        </Panel>

        <Panel title="Profit Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.profitAnalysis}
          />
        </Panel>
      </div>

      <Panel title="Profit Assessments">
        <DataTable
          columns={[
            { key: "title", header: "Assessment" },
            { key: "businessUnit", header: "Unit" },
            { key: "revenue", header: "Revenue" },
            { key: "netProfit", header: "Net Profit" },
            { key: "profitMargin", header: "Margin %" },
            { key: "optimizationOpportunity", header: "Opportunity" },
            { key: "status", header: "Status" },
          ]}
          rows={view.profitAssessments}
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

      <Panel title="Profit Optimization Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.profitOptimizationPipeline}
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
