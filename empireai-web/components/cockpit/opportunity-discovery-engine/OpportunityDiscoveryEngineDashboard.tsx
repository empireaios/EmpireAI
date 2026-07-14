"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useOpportunityDiscoveryEngine } from "@/lib/opportunity-discovery-engine/useOpportunityDiscoveryEngine";

/** Compact Opportunity Discovery Engine strip for Executive Home. */
export function OpportunityDiscoveryEngineStrip() {
  const { view, loading, live } = useOpportunityDiscoveryEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Opportunity Discovery Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-03 Opportunities</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/opportunity-discovery" className="text-xs text-[#d4af37] hover:underline">
          Opportunity discovery →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Discovered</p>
          <p className="text-sm text-[#d4af37]">{view.discoveredOpportunityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Priority</p>
          <p className="text-sm text-emerald-300">{view.priorityOpportunityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Score</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageOpportunityScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Discovery Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.opportunityDiscoveryHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-03 — Permanent Opportunity Discovery Engine panel. */
export function OpportunityDiscoveryEngineDashboard() {
  const { view, loading, error, reload, live, data } = useOpportunityDiscoveryEngine();

  if (loading && !view) {
    return <Panel title="Opportunity Discovery">Loading opportunity discovery engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Opportunity Discovery" subtitle="E4-03 · Opportunity Discovery Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-03 Opportunity Discovery</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE404 && (
            <Link href="/cockpit/founder/threat-detection">
              <Badge variant="gold">E4-04 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/competitor-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Competitor Intelligence →
          </Link>
          <Link href="/cockpit/founder/market-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Market Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Opportunities Discovered" value={String(view.discoveredOpportunityCount)} />
        <StatCard label="Priority Opportunities" value={String(view.priorityOpportunityCount)} />
        <StatCard label="High-Value Opportunities" value={String(view.highValueOpportunityCount)} />
        <StatCard label="Avg Opportunity Score" value={`${view.averageOpportunityScore}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Discovery Health" value={view.opportunityDiscoveryHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Opportunity Pipeline">
        <DataTable
          columns={[
            { key: "title", header: "Opportunity" },
            { key: "category", header: "Category" },
            { key: "market", header: "Market" },
            { key: "expectedRevenue", header: "Revenue" },
            { key: "opportunityScore", header: "Score" },
            { key: "riskLevel", header: "Risk" },
            { key: "priority", header: "Priority" },
          ]}
          rows={view.opportunityPipeline.map((o) => ({
            ...o,
            category: o.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Priority Opportunities">
          <DataTable
            columns={[
              { key: "priorityRank", header: "#" },
              { key: "title", header: "Opportunity" },
              { key: "opportunityScore", header: "Score" },
              { key: "expectedRevenue", header: "Revenue" },
              { key: "strategicValue", header: "Strategic Value" },
            ]}
            rows={view.priorityOpportunities}
          />
        </Panel>

        <Panel title="Revenue Potential">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "expectedRevenue", header: "Revenue" },
              { key: "revenueHorizon", header: "Horizon" },
              { key: "confidence", header: "Confidence" },
              { key: "market", header: "Market" },
            ]}
            rows={view.revenuePotential}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Growth Potential">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "growthRate", header: "Growth" },
              { key: "marketSize", header: "Market Size" },
              { key: "expansionPotential", header: "Potential" },
            ]}
            rows={view.growthPotential}
          />
        </Panel>

        <Panel title="Strategic Value">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "strategicValue", header: "Value" },
              { key: "visionAlignment", header: "Vision" },
              { key: "longTermImpact", header: "Long-Term Impact" },
            ]}
            rows={view.strategicValue}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Opportunity Risks">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "riskLevel", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "mitigation", header: "Mitigation" },
            ]}
            rows={view.opportunityRisks}
          />
        </Panel>

        <Panel title="Opportunity Trends">
          <DataTable
            columns={[
              { key: "trend", header: "Trend" },
              { key: "direction", header: "Direction" },
              { key: "affectedOpportunities", header: "Opportunities" },
              { key: "discoverySignal", header: "Signal" },
            ]}
            rows={view.opportunityTrends}
          />
        </Panel>
      </div>

      <Panel title="Opportunity Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.opportunityAnalysis}
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

      <Panel title="Opportunity Discovery Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.opportunityDiscoveryPipeline}
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
        <Panel title="Opportunity Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.opportunityPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Opportunity Domains">
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
