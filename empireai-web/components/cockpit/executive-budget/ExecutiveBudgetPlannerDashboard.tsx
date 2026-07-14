"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveBudgetPlanner } from "@/lib/executive-budget-planner/useExecutiveBudgetPlanner";

/** Compact Executive Budget Planner strip for Executive Home. */
export function ExecutiveBudgetPlannerStrip() {
  const { view, loading, live } = useExecutiveBudgetPlanner();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Budget Planner…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-03 Budget</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-budget" className="text-xs text-[#d4af37] hover:underline">
          Budget panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Allocated</p>
          <p className="text-sm text-[#d4af37]">{view.totalBudgetAllocated}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Spent</p>
          <p className="text-sm text-violet-300">{view.totalCurrentSpend}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Utilization</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageUtilization}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Remaining</p>
          <p className="text-sm text-[#e8e0d0]">{view.totalRemainingBudget}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-03 — Permanent Executive Budget Planner panel. */
export function ExecutiveBudgetPlannerDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveBudgetPlanner();

  if (loading && !view) {
    return <Panel title="Executive Budget">Loading executive budget planner…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Budget" subtitle="E3-03 · Executive Budget Planner">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-violet-500/50 bg-gradient-to-br from-violet-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-03 Executive Budget Planner</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE304 && (
            <Link href="/cockpit/founder/investment-evaluation">
              <Badge variant="gold">E3-04 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <Link href="/cockpit/founder/capital-allocation" className="text-xs text-[#d4af37] hover:underline">
            Capital Allocation →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.plannerSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Budget Health" value={view.budgetHealth} />
        <StatCard label="Total Allocated" value={view.totalBudgetAllocated} />
        <StatCard label="Current Spend" value={view.totalCurrentSpend} />
        <StatCard label="Remaining" value={view.totalRemainingBudget} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Avg Utilization" value={`${view.averageUtilization}%`} />
        <StatCard label="Active Budgets" value={String(view.activeBudgetCount)} />
      </div>

      <Panel title="Budget Overview">
        <DataTable
          columns={[
            { key: "title", header: "Budget" },
            { key: "category", header: "Category" },
            { key: "allocatedBudget", header: "Allocated" },
            { key: "currentSpend", header: "Spend" },
            { key: "remainingBudget", header: "Remaining" },
            { key: "utilization", header: "Utilization %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.budgetOverview}
        />
      </Panel>

      <Panel title="Budget Allocation by Domain">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "allocated", header: "Allocated" },
            { key: "spent", header: "Spent" },
            { key: "remaining", header: "Remaining" },
            { key: "utilization", header: "Utilization %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.budgetAllocation}
        />
      </Panel>

      <Panel title="Enterprise Budgets">
        <DataTable
          columns={[
            { key: "title", header: "Budget" },
            { key: "category", header: "Category" },
            { key: "allocatedBudget", header: "Allocated" },
            { key: "currentSpend", header: "Spend" },
            { key: "remainingBudget", header: "Remaining" },
            { key: "expectedRoi", header: "ROI" },
            { key: "variance", header: "Variance" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseBudgets.map((b) => ({
            ...b,
            category: b.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Budget Variance">
          <DataTable
            columns={[
              { key: "title", header: "Budget" },
              { key: "planned", header: "Planned" },
              { key: "actual", header: "Actual" },
              { key: "variance", header: "Variance" },
              { key: "severity", header: "Severity" },
              { key: "status", header: "Status" },
            ]}
            rows={view.budgetVariance}
          />
        </Panel>

        <Panel title="Financial Risks">
          <DataTable
            columns={[
              { key: "title", header: "Budget" },
              { key: "severity", header: "Severity" },
              { key: "exposure", header: "Exposure" },
              { key: "mitigation", header: "Mitigation" },
              { key: "status", header: "Status" },
            ]}
            rows={view.budgetRisks}
          />
        </Panel>
      </div>

      <Panel title="Budget Optimization">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.budgetOptimization}
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

      <Panel title="Budget Planning Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.budgetPlanningPipeline}
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
