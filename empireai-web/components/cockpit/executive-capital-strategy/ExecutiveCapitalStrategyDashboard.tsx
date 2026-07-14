"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveCapitalStrategy } from "@/lib/executive-capital-strategy/useExecutiveCapitalStrategy";

/** Compact Executive Capital Strategy strip for Executive Home. */
export function ExecutiveCapitalStrategyStrip() {
  const { view, loading, live } = useExecutiveCapitalStrategy();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Capital Strategy…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-15 Strategy</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-capital-strategy" className="text-xs text-[#d4af37] hover:underline">
          Capital strategy panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Enterprise Value Anchor</p>
          <p className="text-sm text-teal-300">{view.enterpriseValueAnchor}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Capital Under Strategy</p>
          <p className="text-sm text-[#d4af37]">{view.totalCapitalUnderStrategy}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Preservation / Growth</p>
          <p className="text-sm text-[#e8e0d0]">{view.preservationGrowthBand.replace(/_/g, " ")}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strategy Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.strategyHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-15 — Permanent Executive Capital Strategy panel. */
export function ExecutiveCapitalStrategyDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveCapitalStrategy();

  if (loading && !view) {
    return <Panel title="Executive Capital Strategy">Loading executive capital strategy…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Capital Strategy" subtitle="E3-15 · Executive Capital Strategy">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-15 Executive Capital Strategy</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE316 && (
            <Link href="/cockpit/founder/financial-executive-certification">
              <Badge variant="gold">E3-16 Certification</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-valuation" className="text-xs text-[#d4af37] hover:underline">
            Enterprise Valuation →
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
        <StatCard label="Strategy Health" value={view.strategyHealth} />
        <StatCard label="Enterprise Value Anchor" value={view.enterpriseValueAnchor} />
        <StatCard label="Capital Under Strategy" value={view.totalCapitalUnderStrategy} />
        <StatCard label="Active Strategies" value={String(view.activeStrategyCount)} />
      </div>

      <Panel title="Strategy Summary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-[#6f6a60]">Long-Term Strategy</p>
            <p className="text-sm text-[#e8e0d0]">{view.strategySummary.longTermStrategy}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Top Priority</p>
            <p className="text-sm text-teal-300">{view.strategySummary.topPriority}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Liquidity Coverage</p>
            <p className="text-sm text-[#e8e0d0]">{view.strategySummary.liquidityCoverage}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Capital Allocation Priorities">
        <DataTable
          columns={[
            { key: "priorityRank", header: "Rank" },
            { key: "title", header: "Priority" },
            { key: "capitalAmount", header: "Capital" },
            { key: "allocationPercent", header: "%" },
            { key: "horizon", header: "Horizon" },
            { key: "status", header: "Status" },
          ]}
          rows={view.allocationPriorities}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Investment Horizons">
          <DataTable
            columns={[
              { key: "label", header: "Horizon" },
              { key: "capitalAllocated", header: "Capital" },
              { key: "investmentCount", header: "Investments" },
              { key: "expectedReturn", header: "Expected Return" },
              { key: "riskLevel", header: "Risk" },
            ]}
            rows={view.investmentHorizons}
          />
        </Panel>

        <Panel title="Preservation vs Growth">
          <DataTable
            columns={[
              { key: "label", header: "Band" },
              { key: "preservationPercent", header: "Preservation %" },
              { key: "growthPercent", header: "Growth %" },
              { key: "capitalPreserved", header: "Preserved" },
              { key: "capitalDeployed", header: "Deployed" },
              { key: "status", header: "Status" },
            ]}
            rows={view.preservationGrowthProfiles}
          />
        </Panel>
      </div>

      <Panel title="Strategic Deployments">
        <DataTable
          columns={[
            { key: "title", header: "Deployment" },
            { key: "capitalRequired", header: "Capital" },
            { key: "deploymentPhase", header: "Phase" },
            { key: "expectedValue", header: "Expected Value" },
            { key: "roiProjection", header: "ROI" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status" },
          ]}
          rows={view.strategicDeployments}
        />
      </Panel>

      <Panel title="Capital Strategies">
        <DataTable
          columns={[
            { key: "title", header: "Strategy" },
            { key: "horizon", header: "Horizon" },
            { key: "capitalAllocation", header: "Capital" },
            { key: "preservationWeight", header: "Preservation" },
            { key: "growthWeight", header: "Growth" },
            { key: "expectedReturn", header: "Return" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalStrategies}
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

      <Panel title="Strategy Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.strategyAnalysis}
        />
      </Panel>

      <Panel title="Capital Strategy Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalStrategyPipeline}
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
