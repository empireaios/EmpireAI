"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useLongTermGrowthPlanner } from "@/lib/long-term-growth-planner/useLongTermGrowthPlanner";

/** Compact Long-Term Growth strip for Executive Home. */
export function LongTermGrowthStrip() {
  const { view, loading, live } = useLongTermGrowthPlanner();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Long-Term Growth…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-11 Growth</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/long-term-growth" className="text-xs text-[#d4af37] hover:underline">
          Growth panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Planning Horizons</p>
          <p className="text-sm text-[#d4af37]">{view.planningHorizons.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth Initiatives</p>
          <p className="text-sm text-[#e8e0d0]">{view.growthInitiatives.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth Capacity</p>
          <p className="line-clamp-1 text-sm text-[#e8e0d0]">{view.growthCapacity}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.visionAlignment}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-11 — Permanent Long-Term Growth Planner panel. */
export function LongTermGrowthDashboard() {
  const { view, loading, error, reload, live, data } = useLongTermGrowthPlanner();

  if (loading && !view) {
    return <Panel title="Long-Term Growth">Loading growth planner…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Long-Term Growth" subtitle="E1-11 · Long-Term Growth Planner">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-11 Long-Term Growth</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE112 && <Badge variant="gold">Ready for E1-12</Badge>}
          <Link href="/cockpit/founder/opportunity-prioritization" className="text-xs text-[#d4af37] hover:underline">
            Opportunity Prioritization →
          </Link>
          <Link href="/cockpit/founder/executive-scenarios" className="text-xs text-[#d4af37] hover:underline">
            Executive Scenarios →
          </Link>
          <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
            Corporate Vision →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.plannerSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Planner Health" value={view.plannerHealth} />
        <StatCard label="Growth Readiness" value={view.growthReadiness} />
        <StatCard label="Growth Capacity" value={view.growthCapacity} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Planning Horizons">
        <DataTable
          columns={[
            { key: "label", header: "Horizon" },
            { key: "timeframe", header: "Timeframe" },
            { key: "summary", header: "Summary" },
            { key: "visionSync", header: "Vision Sync" },
            { key: "status", header: "Status" },
          ]}
          rows={view.planningHorizons}
        />
      </Panel>

      <Panel title="Growth Roadmap">
        <DataTable
          columns={[
            { key: "period", header: "Period" },
            { key: "milestone", header: "Milestone" },
            { key: "programmes", header: "Programmes" },
            { key: "status", header: "Status" },
          ]}
          rows={view.growthRoadmap.map((r) => ({
            ...r,
            programmes: r.programmes.join(", "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Growth Objectives">
          <DataTable
            columns={[
              { key: "title", header: "Objective" },
              { key: "strategicObjective", header: "Strategic Link" },
              { key: "confidence", header: "Confidence" },
              { key: "priority", header: "Priority" },
            ]}
            rows={view.growthObjectives}
          />
        </Panel>

        <Panel title="Investment Pipeline">
          <DataTable
            columns={[
              { key: "title", header: "Investment" },
              { key: "amount", header: "Amount" },
              { key: "timeline", header: "Timeline" },
              { key: "expectedRoi", header: "ROI" },
              { key: "status", header: "Status" },
            ]}
            rows={view.investmentPipeline}
          />
        </Panel>
      </div>

      <Panel title="Growth Initiatives">
        <DataTable
          columns={[
            { key: "title", header: "Initiative" },
            { key: "domain", header: "Domain" },
            { key: "expectedValue", header: "Expected Value" },
            { key: "targetTimeline", header: "Timeline" },
            { key: "confidence", header: "Confidence" },
            { key: "priority", header: "Priority" },
          ]}
          rows={view.growthInitiatives.map((i) => ({
            ...i,
            domain: i.domain.replace(/_/g, " "),
            targetTimeline: i.targetTimeline.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strategic Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "expectedValue", header: "Value" },
              { key: "horizon", header: "Horizon" },
              { key: "confidence", header: "Confidence" },
            ]}
            rows={view.strategicOpportunities}
          />
        </Panel>

        <Panel title="Growth Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "horizon", header: "Horizon" },
              { key: "mitigation", header: "Mitigation" },
            ]}
            rows={view.growthRisks}
          />
        </Panel>
      </div>

      <Panel title="Growth Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
          ]}
          rows={view.growthAnalysis}
        />
      </Panel>

      <Panel title="Growth Hierarchy">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.growthHierarchy}
        />
      </Panel>

      <Panel title="Growth Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.growthPipeline}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
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
