"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCustomerBehaviourIntelligence } from "@/lib/customer-behaviour-intelligence/useCustomerBehaviourIntelligence";

/** Compact Customer Behaviour Intelligence strip for Executive Home. */
export function CustomerBehaviourIntelligenceStrip() {
  const { view, loading, live } = useCustomerBehaviourIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Customer Behaviour Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-06 Customers</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/customer-behaviour" className="text-xs text-[#d4af37] hover:underline">
          Customer behaviour →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Segments</p>
          <p className="text-sm text-[#d4af37]">{view.monitoredSegmentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">High-Value</p>
          <p className="text-sm text-cyan-300">{view.highValueSegmentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">At-Risk</p>
          <p className="text-sm text-amber-300">{view.atRiskSegmentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Retention</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageRetentionProbability}%</p>
        </div>
      </div>
    </section>
  );
}

/** E4-06 — Permanent Customer Behaviour Intelligence panel. */
export function CustomerBehaviourIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useCustomerBehaviourIntelligence();

  if (loading && !view) {
    return <Panel title="Customer Behaviour">Loading customer behaviour intelligence…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Customer Behaviour" subtitle="E4-06 · Customer Behaviour Intelligence">
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
          <Badge variant="gold">E4-06 Customer Behaviour</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE407 && (
            <Link href="/cockpit/founder/innovation-intelligence">
              <Badge variant="gold">E4-07 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/industry-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Industry Intelligence →
          </Link>
          <Link href="/cockpit/founder/opportunity-discovery" className="text-xs text-[#d4af37] hover:underline">
            Opportunity Discovery →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Segments Monitored" value={String(view.monitoredSegmentCount)} />
        <StatCard label="High-Value Segments" value={String(view.highValueSegmentCount)} />
        <StatCard label="At-Risk Segments" value={String(view.atRiskSegmentCount)} />
        <StatCard label="Avg Retention" value={`${view.averageRetentionProbability}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Intelligence Health" value={view.customerIntelligenceHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Customer Segments">
        <DataTable
          columns={[
            { key: "customerSegment", header: "Segment" },
            { key: "category", header: "Category" },
            { key: "segmentSize", header: "Size" },
            { key: "averageSpend", header: "Avg Spend" },
            { key: "strategicRelevance", header: "Relevance" },
          ]}
          rows={view.customerSegments}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Buying Trends">
          <DataTable
            columns={[
              { key: "trend", header: "Trend" },
              { key: "direction", header: "Direction" },
              { key: "affectedSegments", header: "Segments" },
              { key: "behaviourSignal", header: "Signal" },
            ]}
            rows={view.buyingTrends}
          />
        </Panel>

        <Panel title="Purchase Intent">
          <DataTable
            columns={[
              { key: "customerSegment", header: "Segment" },
              { key: "purchaseIntent", header: "Intent" },
              { key: "intentScore", header: "Score" },
              { key: "buyingFrequency", header: "Frequency" },
            ]}
            rows={view.purchaseIntent}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customer Lifetime Value">
          <DataTable
            columns={[
              { key: "customerSegment", header: "Segment" },
              { key: "customerLifetimeValue", header: "CLV" },
              { key: "averageSpend", header: "Avg Spend" },
              { key: "retentionProbability", header: "Retention %" },
            ]}
            rows={view.customerLifetimeValue}
          />
        </Panel>

        <Panel title="Retention Trends">
          <DataTable
            columns={[
              { key: "customerSegment", header: "Segment" },
              { key: "retentionProbability", header: "Retention %" },
              { key: "satisfactionTrend", header: "Satisfaction" },
              { key: "trendDirection", header: "Direction" },
            ]}
            rows={view.retentionTrends}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customer Risks">
          <DataTable
            columns={[
              { key: "customerSegment", header: "Segment" },
              { key: "riskLevel", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "riskType", header: "Type" },
            ]}
            rows={view.customerRisks}
          />
        </Panel>

        <Panel title="Growth Opportunities">
          <DataTable
            columns={[
              { key: "customerSegment", header: "Segment" },
              { key: "growthOpportunity", header: "Opportunity" },
              { key: "purchaseIntent", header: "Intent" },
              { key: "strategicRelevance", header: "Relevance" },
            ]}
            rows={view.growthOpportunities}
          />
        </Panel>
      </div>

      <Panel title="Customer Insights">
        <DataTable
          columns={[
            { key: "customerSegment", header: "Segment" },
            { key: "behaviourCategory", header: "Behaviour" },
            { key: "purchaseIntent", header: "Intent" },
            { key: "customerLifetimeValue", header: "CLV" },
            { key: "retentionProbability", header: "Retention" },
            { key: "riskLevel", header: "Risk" },
          ]}
          rows={view.customerInsights.map((c) => ({
            ...c,
            category: c.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Customer Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.customerAnalysis}
        />
      </Panel>

      <Panel title="Executive Recommendations">
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

      <Panel title="Customer Intelligence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.customerIntelligencePipeline}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Customer Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.customerPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Customer Domains">
          <DataTable
            columns={[{ key: "domain", header: "Domain" }]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
