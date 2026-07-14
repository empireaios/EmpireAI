"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useInnovationIntelligenceEngine } from "@/lib/innovation-intelligence-engine/useInnovationIntelligenceEngine";

/** Compact Innovation Intelligence Engine strip for Executive Home. */
export function InnovationIntelligenceEngineStrip() {
  const { view, loading, live } = useInnovationIntelligenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Innovation Intelligence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-07 Innovation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/innovation-intelligence" className="text-xs text-[#d4af37] hover:underline">
          Innovation intelligence →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Discovered</p>
          <p className="text-sm text-[#d4af37]">{view.discoveredInnovationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Disruptive</p>
          <p className="text-sm text-violet-300">{view.disruptiveInnovationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Emerging Tech</p>
          <p className="text-sm text-purple-300">{view.emergingTechnologyCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Adoption Readiness</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageAdoptionReadiness}%</p>
        </div>
      </div>
    </section>
  );
}

/** E4-07 — Permanent Innovation Intelligence Engine panel. */
export function InnovationIntelligenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useInnovationIntelligenceEngine();

  if (loading && !view) {
    return <Panel title="Innovation Intelligence">Loading innovation intelligence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Innovation Intelligence" subtitle="E4-07 · Innovation Intelligence Engine">
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
          <Badge variant="gold">E4-07 Innovation Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE408 && (
            <Link href="/cockpit/founder/executive-knowledge-graph">
              <Badge variant="gold">E4-08 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/customer-behaviour" className="text-xs text-[#d4af37] hover:underline">
            Customer Behaviour →
          </Link>
          <Link href="/cockpit/founder/industry-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Industry Intelligence →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Innovations Discovered" value={String(view.discoveredInnovationCount)} />
        <StatCard label="Disruptive Innovations" value={String(view.disruptiveInnovationCount)} />
        <StatCard label="Emerging Technologies" value={String(view.emergingTechnologyCount)} />
        <StatCard label="Avg Adoption Readiness" value={`${view.averageAdoptionReadiness}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Intelligence Health" value={view.innovationIntelligenceHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Innovation Pipeline">
        <DataTable
          columns={[
            { key: "title", header: "Innovation" },
            { key: "category", header: "Category" },
            { key: "technology", header: "Technology" },
            { key: "adoptionReadiness", header: "Readiness" },
            { key: "implementationComplexity", header: "Complexity" },
            { key: "priority", header: "Priority" },
          ]}
          rows={view.innovationPipeline.map((i) => ({
            ...i,
            category: i.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Emerging Technologies">
          <DataTable
            columns={[
              { key: "title", header: "Technology" },
              { key: "technology", header: "Stack" },
              { key: "adoptionReadiness", header: "Readiness" },
              { key: "disruptionPotential", header: "Disruption" },
              { key: "timeHorizon", header: "Horizon" },
            ]}
            rows={view.emergingTechnologies}
          />
        </Panel>

        <Panel title="Disruptive Innovations">
          <DataTable
            columns={[
              { key: "title", header: "Innovation" },
              { key: "category", header: "Category" },
              { key: "businessImpact", header: "Business Impact" },
              { key: "priority", header: "Priority" },
            ]}
            rows={view.disruptiveInnovations}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strategic Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Innovation" },
              { key: "strategicImpact", header: "Strategic Impact" },
              { key: "adoptionReadiness", header: "Readiness" },
              { key: "financialImpact", header: "Financial" },
            ]}
            rows={view.strategicOpportunities}
          />
        </Panel>

        <Panel title="Innovation Readiness">
          <DataTable
            columns={[
              { key: "title", header: "Innovation" },
              { key: "adoptionReadiness", header: "Adoption" },
              { key: "implementationComplexity", header: "Complexity" },
              { key: "marketReadiness", header: "Market" },
            ]}
            rows={view.innovationReadiness}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Business Impact">
          <DataTable
            columns={[
              { key: "title", header: "Innovation" },
              { key: "businessImpact", header: "Business" },
              { key: "financialImpact", header: "Financial" },
              { key: "priority", header: "Priority" },
            ]}
            rows={view.businessImpact}
          />
        </Panel>

        <Panel title="Innovation Risks">
          <DataTable
            columns={[
              { key: "title", header: "Innovation" },
              { key: "riskLevel", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "riskType", header: "Type" },
            ]}
            rows={view.innovationRisks}
          />
        </Panel>
      </div>

      <Panel title="Innovation Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.innovationAnalysis}
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

      <Panel title="Innovation Intelligence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.innovationIntelligencePipeline}
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
        <Panel title="Innovation Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.innovationPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Innovation Domains">
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
