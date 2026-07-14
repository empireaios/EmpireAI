"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useOpportunityPrioritizationEngine } from "@/lib/opportunity-prioritization-engine/useOpportunityPrioritizationEngine";

/** Compact Opportunity Prioritization strip for Executive Home. */
export function OpportunityPrioritizationStrip() {
  const { view, loading, live } = useOpportunityPrioritizationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Opportunity Prioritization…
      </section>
    );
  }

  if (!view) return null;

  const top = view.highestPriorityOpportunities[0];

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-12 Opportunities</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/opportunity-prioritization" className="text-xs text-[#d4af37] hover:underline">
          Opportunity panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Opportunities</p>
          <p className="text-sm text-[#d4af37]">{view.activeOpportunityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Top Opportunity</p>
          <p className="line-clamp-1 text-sm text-[#e8e0d0]">{top?.title ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Priority Score</p>
          <p className="text-sm text-[#e8e0d0]">{view.topOpportunityScore}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strategic Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.strategicAlignment}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-12 — Permanent Opportunity Prioritization Engine panel. */
export function OpportunityPrioritizationDashboard() {
  const { view, loading, error, reload, live, data } = useOpportunityPrioritizationEngine();

  if (loading && !view) {
    return <Panel title="Opportunity Prioritization">Loading opportunity engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Opportunity Prioritization" subtitle="E1-12 · Opportunity Prioritization Engine">
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
          <Badge variant="gold">E1-12 Opportunity Prioritization</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE113 && <Badge variant="gold">Ready for E1-13</Badge>}
          <Link href="/cockpit/founder/strategic-alignment" className="text-xs text-[#d4af37] hover:underline">
            Strategic Alignment →
          </Link>
          <Link href="/cockpit/founder/long-term-growth" className="text-xs text-[#d4af37] hover:underline">
            Long-Term Growth →
          </Link>
          <Link href="/cockpit/founder/priority-management" className="text-xs text-[#d4af37] hover:underline">
            Priority Management →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Opportunities" value={String(view.activeOpportunityCount)} />
        <StatCard label="Top Priority Score" value={String(view.topOpportunityScore)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Highest Priority Opportunities">
        <DataTable
          columns={[
            { key: "recommendedOrder", header: "#" },
            { key: "title", header: "Opportunity" },
            { key: "category", header: "Category" },
            { key: "priorityScore", header: "Score" },
            { key: "expectedRoi", header: "Expected ROI" },
            { key: "expectedBusinessValue", header: "Business" },
            { key: "expectedFinancialValue", header: "Financial" },
            { key: "riskLevel", header: "Risk" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.highestPriorityOpportunities.map((o) => ({
            ...o,
            category: o.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Opportunity Queue">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Opportunity" },
            { key: "category", header: "Category" },
            { key: "priorityScore", header: "Score" },
            { key: "expectedRoi", header: "ROI" },
            { key: "owner", header: "Owner" },
            { key: "eta", header: "ETA" },
          ]}
          rows={view.opportunityQueue.map((q) => ({
            ...q,
            category: q.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Prioritization Model">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "weight", header: "Weight" },
              { key: "weightedScore", header: "Weighted" },
            ]}
            rows={view.prioritizationModel}
          />
        </Panel>

        <Panel title="Opportunity Pipeline">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "label", header: "Phase" },
              { key: "status", header: "Status" },
            ]}
            rows={view.opportunityPipeline}
          />
        </Panel>
      </div>

      <Panel title="All Opportunities">
        <DataTable
          columns={[
            { key: "title", header: "Opportunity" },
            { key: "category", header: "Category" },
            { key: "source", header: "Source" },
            { key: "priorityScore", header: "Score" },
            { key: "expectedRoi", header: "ROI" },
            { key: "riskLevel", header: "Risk" },
            { key: "strategicAlignment", header: "Alignment" },
          ]}
          rows={view.allOpportunities.map((o) => ({
            ...o,
            category: o.category.replace(/_/g, " "),
            source: o.source.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Recommended Actions">
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
