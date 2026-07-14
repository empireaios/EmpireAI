"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCostOptimizationEngine } from "@/lib/cost-optimization-engine/useCostOptimizationEngine";

/** Compact Cost Optimization Engine strip for Executive Home. */
export function CostOptimizationEngineStrip() {
  const { view, loading, live } = useCostOptimizationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Cost Optimization Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-08 Cost</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/cost-optimization" className="text-xs text-[#d4af37] hover:underline">
          Cost panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Enterprise Cost</p>
          <p className="text-sm text-[#d4af37]">{view.totalEnterpriseCost}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Savings</p>
          <p className="text-sm text-orange-300">{view.totalSavingsIdentified}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Efficiency</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageCostEfficiency}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Waste Items</p>
          <p className="text-sm text-[#e8e0d0]">{view.wasteItemsDetected}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-08 — Permanent Cost Optimization Engine panel. */
export function CostOptimizationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useCostOptimizationEngine();

  if (loading && !view) {
    return <Panel title="Cost Optimization">Loading cost optimization engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Cost Optimization" subtitle="E3-08 · Cost Optimization Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-orange-500/50 bg-gradient-to-br from-orange-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-08 Cost Optimization Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE309 && (
            <Link href="/cockpit/founder/financial-scenario">
              <Badge variant="gold">E3-09 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/profit-optimization" className="text-xs text-[#d4af37] hover:underline">
            Profit Optimization →
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
        <StatCard label="Cost Health" value={view.costHealth} />
        <StatCard label="Enterprise Cost" value={view.totalEnterpriseCost} />
        <StatCard label="Savings Identified" value={view.totalSavingsIdentified} />
        <StatCard label="Cost Efficiency" value={`${view.averageCostEfficiency}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Optimization Potential" value={`${view.averageOptimizationPotential}%`} />
        <StatCard label="Waste Detected" value={String(view.wasteItemsDetected)} />
      </div>

      <Panel title="Enterprise Costs">
        <DataTable
          columns={[
            { key: "title", header: "Cost Area" },
            { key: "category", header: "Category" },
            { key: "currentCost", header: "Current Cost" },
            { key: "costVariance", header: "Variance" },
            { key: "savingsOpportunity", header: "Savings" },
            { key: "optimizationPotential", header: "Potential %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseCosts}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cost Breakdown">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "currentCost", header: "Cost" },
              { key: "percentage", header: "Share %" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.costBreakdown}
          />
        </Panel>

        <Panel title="Cost Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "enterpriseCost", header: "Cost" },
              { key: "costEfficiency", header: "Efficiency %" },
              { key: "savingsAchieved", header: "Savings" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.costTrends}
          />
        </Panel>
      </div>

      <Panel title="Savings Opportunities">
        <DataTable
          columns={[
            { key: "title", header: "Opportunity" },
            { key: "capability", header: "Capability" },
            { key: "estimatedSavings", header: "Est. Savings" },
            { key: "businessImpact", header: "Impact" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status" },
          ]}
          rows={view.savingsOpportunities.map((o) => ({
            ...o,
            capability: o.capability.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Efficiency Metrics">
          <DataTable
            columns={[
              { key: "metric", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "score", header: "Score" },
              { key: "trend", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.efficiencyMetrics}
          />
        </Panel>

        <Panel title="Waste Detection">
          <DataTable
            columns={[
              { key: "title", header: "Cost Area" },
              { key: "severity", header: "Severity" },
              { key: "exposure", header: "Exposure" },
              { key: "elimination", header: "Elimination" },
              { key: "status", header: "Status" },
            ]}
            rows={view.wasteDetection}
          />
        </Panel>
      </div>

      <Panel title="Cost Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.costAnalysis}
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

      <Panel title="Cost Optimization Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.costOptimizationPipeline}
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
