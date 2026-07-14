"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveFinanceFramework } from "@/lib/executive-finance-framework/useExecutiveFinanceFramework";

/** Compact Executive Finance Framework strip for Executive Home. */
export function ExecutiveFinanceFrameworkStrip() {
  const { view, loading, live } = useExecutiveFinanceFramework();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Finance Framework…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-01 Finance</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
          Finance panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Capital</p>
          <p className="text-sm text-[#d4af37]">{view.totalCapitalAllocated}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue Target</p>
          <p className="text-sm text-cyan-300">{view.totalExpectedRevenue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Financial Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.financialHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg ROI</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageRoi}%</p>
        </div>
      </div>
    </section>
  );
}

/** E3-01 — Permanent Executive Finance Framework panel. */
export function ExecutiveFinanceFrameworkDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveFinanceFramework();

  if (loading && !view) {
    return <Panel title="Executive Finance">Loading executive finance framework…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Finance" subtitle="E3-01 · Executive Finance Framework">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-cyan-500/50 bg-gradient-to-br from-cyan-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-01 Executive Finance Framework</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE302 && (
            <Link href="/cockpit/founder/capital-allocation">
              <Badge variant="gold">E3-02 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-decision-certification" className="text-xs text-[#d4af37] hover:underline">
            E2 Certified →
          </Link>
          <Link href="/cockpit/founder/resource-allocation" className="text-xs text-[#d4af37] hover:underline">
            Resource Allocation →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.frameworkSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Financial Health" value={view.financialHealth} />
        <StatCard label="Capital Position" value={view.totalCapitalAllocated} />
        <StatCard label="Budget Allocated" value={view.totalBudgetAllocated} />
        <StatCard label="Expected Profit" value={view.totalExpectedProfit} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Revenue Target" value={view.totalExpectedRevenue} />
        <StatCard label="Expected Cost" value={view.totalExpectedCost} />
        <StatCard label="Average ROI" value={`${view.averageRoi}%`} />
      </div>

      <Panel title="Capital Position">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "amount", header: "Amount" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.capitalPosition}
        />
      </Panel>

      <Panel title="Budget Status">
        <DataTable
          columns={[
            { key: "title", header: "Programme" },
            { key: "allocated", header: "Allocated" },
            { key: "spent", header: "Spent" },
            { key: "remaining", header: "Remaining" },
            { key: "utilisation", header: "Utilisation %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.budgetStatus}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <StatCard label="Revenue" value={view.totalExpectedRevenue} />
        <StatCard label="Cost" value={view.totalExpectedCost} />
        <StatCard label="Profit" value={view.totalExpectedProfit} />
      </div>

      <Panel title="Financial Entities">
        <DataTable
          columns={[
            { key: "title", header: "Entity" },
            { key: "category", header: "Category" },
            { key: "capitalAllocation", header: "Capital" },
            { key: "budgetAllocation", header: "Budget" },
            { key: "expectedRoi", header: "ROI" },
            { key: "financialRisk", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.financialEntities.map((e) => ({
            ...e,
            category: e.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Financial Risks">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "exposure", header: "Exposure" },
            { key: "mitigation", header: "Mitigation" },
            { key: "status", header: "Status" },
          ]}
          rows={view.financialRisks}
        />
      </Panel>

      <Panel title="Financial Governance">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.financialGovernance}
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

      <Panel title="Financial Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.financialPipeline}
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
