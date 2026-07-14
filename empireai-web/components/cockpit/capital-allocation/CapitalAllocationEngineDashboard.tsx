"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCapitalAllocationEngine } from "@/lib/capital-allocation-engine/useCapitalAllocationEngine";

/** Compact Capital Allocation Engine strip for Executive Home. */
export function CapitalAllocationEngineStrip() {
  const { view, loading, live } = useCapitalAllocationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Capital Allocation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-02 Capital</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/capital-allocation" className="text-xs text-[#d4af37] hover:underline">
          Capital panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Deployed</p>
          <p className="text-sm text-[#d4af37]">{view.totalCapitalDeployed}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg ROI</p>
          <p className="text-sm text-amber-300">{view.averageExpectedRoi}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Utilization</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageUtilization}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeAllocationCount}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-02 — Permanent Capital Allocation Engine panel. */
export function CapitalAllocationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useCapitalAllocationEngine();

  if (loading && !view) {
    return <Panel title="Capital Allocation">Loading capital allocation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Capital Allocation" subtitle="E3-02 · Capital Allocation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-02 Capital Allocation Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE303 && (
            <Link href="/cockpit/founder/executive-budget">
              <Badge variant="gold">E3-03 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
            Risk Assessment →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Capital Health" value={view.capitalHealth} />
        <StatCard label="Capital Deployed" value={view.totalCapitalDeployed} />
        <StatCard label="Avg Expected ROI" value={`${view.averageExpectedRoi}%`} />
        <StatCard label="Avg Utilization" value={`${view.averageUtilization}%`} />
      </div>

      <Panel title="Capital Portfolio">
        <DataTable
          columns={[
            { key: "title", header: "Investment" },
            { key: "category", header: "Category" },
            { key: "allocatedCapital", header: "Capital" },
            { key: "expectedRoi", header: "Expected ROI" },
            { key: "utilization", header: "Utilization %" },
            { key: "strategicAlignment", header: "Alignment" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalPortfolio}
        />
      </Panel>

      <Panel title="Current Allocations">
        <DataTable
          columns={[
            { key: "title", header: "Allocation" },
            { key: "category", header: "Category" },
            { key: "allocatedCapital", header: "Capital" },
            { key: "expectedRoi", header: "ROI" },
            { key: "investmentHorizon", header: "Horizon" },
            { key: "riskAssessment", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentAllocations.map((a) => ({
            ...a,
            category: a.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Capital Utilization">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "allocated", header: "Allocated" },
              { key: "utilized", header: "Utilized %" },
              { key: "efficiency", header: "Efficiency" },
              { key: "status", header: "Status" },
            ]}
            rows={view.capitalUtilization}
          />
        </Panel>

        <Panel title="Investment Performance">
          <DataTable
            columns={[
              { key: "title", header: "Investment" },
              { key: "expectedRoi", header: "Expected" },
              { key: "actualRoi", header: "Actual" },
              { key: "performance", header: "Performance" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.investmentPerformance}
          />
        </Panel>
      </div>

      <Panel title="Financial Risks">
        <DataTable
          columns={[
            { key: "title", header: "Allocation" },
            { key: "severity", header: "Severity" },
            { key: "exposure", header: "Exposure" },
            { key: "mitigation", header: "Mitigation" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalRisks}
        />
      </Panel>

      <Panel title="Strategic Alignment">
        <DataTable
          columns={[
            { key: "title", header: "Allocation" },
            { key: "objective", header: "Objective" },
            { key: "alignmentScore", header: "Score" },
            { key: "status", header: "Status" },
            { key: "evidence", header: "Evidence" },
          ]}
          rows={view.capitalStrategicAlignment}
        />
      </Panel>

      <Panel title="Capital Optimization">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.capitalOptimization}
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

      <Panel title="Capital Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.capitalPipeline}
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
