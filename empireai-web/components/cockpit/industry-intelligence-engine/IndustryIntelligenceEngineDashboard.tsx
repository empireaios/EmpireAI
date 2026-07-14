"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useIndustryIntelligenceEngine } from "@/lib/industry-intelligence-engine/useIndustryIntelligenceEngine";

/** Compact Industry Intelligence Engine strip for Executive Home. */
export function IndustryIntelligenceEngineStrip() {
  const { view, loading, live } = useIndustryIntelligenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Industry Intelligence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-05 Industries</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/industry-intelligence" className="text-xs text-[#d4af37] hover:underline">
          Industry intelligence →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Monitored</p>
          <p className="text-sm text-[#d4af37]">{view.monitoredIndustryCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Growth</p>
          <p className="text-sm text-indigo-300">{view.growthIndustryCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Emerging</p>
          <p className="text-sm text-purple-300">{view.emergingIndustryCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Intelligence Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.industryIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-05 — Permanent Industry Intelligence Engine panel. */
export function IndustryIntelligenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useIndustryIntelligenceEngine();

  if (loading && !view) {
    return <Panel title="Industry Intelligence">Loading industry intelligence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Industry Intelligence" subtitle="E4-05 · Industry Intelligence Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-05 Industry Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE406 && (
            <Link href="/cockpit/founder/customer-behaviour">
              <Badge variant="gold">E4-06 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/threat-detection" className="text-xs text-[#d4af37] hover:underline">
            Threat Detection →
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
        <StatCard label="Industries Monitored" value={String(view.monitoredIndustryCount)} />
        <StatCard label="Growth Industries" value={String(view.growthIndustryCount)} />
        <StatCard label="Emerging Industries" value={String(view.emergingIndustryCount)} />
        <StatCard label="Avg Opportunity Score" value={`${view.averageOpportunityScore}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Intelligence Health" value={view.industryIntelligenceHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Industry Landscape">
        <DataTable
          columns={[
            { key: "industryName", header: "Industry" },
            { key: "category", header: "Category" },
            { key: "sector", header: "Sector" },
            { key: "marketSize", header: "Market Size" },
            { key: "growthRate", header: "Growth" },
            { key: "opportunityScore", header: "Opportunity" },
            { key: "riskScore", header: "Risk" },
          ]}
          rows={view.industryLandscape.map((i) => ({
            ...i,
            category: i.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Industry Trends">
          <DataTable
            columns={[
              { key: "trend", header: "Trend" },
              { key: "direction", header: "Direction" },
              { key: "affectedIndustries", header: "Industries" },
              { key: "evolutionSignal", header: "Signal" },
            ]}
            rows={view.industryTrends}
          />
        </Panel>

        <Panel title="Growth Industries">
          <DataTable
            columns={[
              { key: "industryName", header: "Industry" },
              { key: "growthRate", header: "Growth" },
              { key: "marketSize", header: "Market Size" },
              { key: "opportunityScore", header: "Score" },
              { key: "strategicRelevance", header: "Relevance" },
            ]}
            rows={view.growthIndustries}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Emerging Industries">
          <DataTable
            columns={[
              { key: "industryName", header: "Industry" },
              { key: "category", header: "Category" },
              { key: "innovationRate", header: "Innovation" },
              { key: "timeHorizon", header: "Horizon" },
            ]}
            rows={view.emergingIndustries}
          />
        </Panel>

        <Panel title="Industry Risks">
          <DataTable
            columns={[
              { key: "industryName", header: "Industry" },
              { key: "riskScore", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "riskType", header: "Type" },
            ]}
            rows={view.industryRisks}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Industry Opportunities">
          <DataTable
            columns={[
              { key: "industryName", header: "Industry" },
              { key: "opportunityScore", header: "Score" },
              { key: "strategicValue", header: "Value" },
              { key: "marketSize", header: "Market Size" },
            ]}
            rows={view.industryOpportunities}
          />
        </Panel>

        <Panel title="Innovation Activity">
          <DataTable
            columns={[
              { key: "industryName", header: "Industry" },
              { key: "innovationRate", header: "Innovation" },
              { key: "keyTechnologies", header: "Technologies" },
              { key: "disruptionPotential", header: "Disruption" },
            ]}
            rows={view.innovationActivity}
          />
        </Panel>
      </div>

      <Panel title="Industry Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.industryAnalysis}
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

      <Panel title="Industry Intelligence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.industryIntelligencePipeline}
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
        <Panel title="Industry Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.industryPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Industry Domains">
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
