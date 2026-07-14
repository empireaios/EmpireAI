"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCompetitorIntelligenceEngine } from "@/lib/competitor-intelligence-engine/useCompetitorIntelligenceEngine";

/** Compact Competitor Intelligence Engine strip for Executive Home. */
export function CompetitorIntelligenceEngineStrip() {
  const { view, loading, live } = useCompetitorIntelligenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Competitor Intelligence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-02 Competitors</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/competitor-intelligence" className="text-xs text-[#d4af37] hover:underline">
          Competitor intelligence →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Tracked</p>
          <p className="text-sm text-[#d4af37]">{view.trackedCompetitorCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Threats</p>
          <p className="text-sm text-rose-300">{view.threatCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Opportunities</p>
          <p className="text-sm text-[#e8e0d0]">{view.opportunityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Intelligence Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.competitorIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-02 — Permanent Competitor Intelligence Engine panel. */
export function CompetitorIntelligenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useCompetitorIntelligenceEngine();

  if (loading && !view) {
    return <Panel title="Competitor Intelligence">Loading competitor intelligence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Competitor Intelligence" subtitle="E4-02 · Competitor Intelligence Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-rose-500/50 bg-gradient-to-br from-rose-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-02 Competitor Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE403 && (
            <Link href="/cockpit/founder/opportunity-discovery">
              <Badge variant="gold">E4-03 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/market-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Market Intelligence →
          </Link>
          <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
            Corporate Vision →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Competitors Tracked" value={String(view.trackedCompetitorCount)} />
        <StatCard label="Direct Competitors" value={String(view.directCompetitorCount)} />
        <StatCard label="Competitive Threats" value={String(view.threatCount)} />
        <StatCard label="Avg Threat Level" value={`${view.averageThreatLevel}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Opportunities" value={String(view.opportunityCount)} />
        <StatCard label="Intelligence Health" value={view.competitorIntelligenceHealth} />
      </div>

      <Panel title="Competitor Landscape">
        <DataTable
          columns={[
            { key: "competitorName", header: "Competitor" },
            { key: "category", header: "Category" },
            { key: "industry", header: "Industry" },
            { key: "marketPosition", header: "Position" },
            { key: "threatLevel", header: "Threat" },
            { key: "opportunityLevel", header: "Opportunity" },
            { key: "strategicRelevance", header: "Relevance" },
          ]}
          rows={view.competitorLandscape
            .filter((c) => c.competitorId !== "cie-empireai-position")
            .map((c) => ({
              ...c,
              category: c.category.replace(/_/g, " "),
            }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Market Leaders">
          <DataTable
            columns={[
              { key: "competitorName", header: "Leader" },
              { key: "industry", header: "Industry" },
              { key: "marketShare", header: "Share" },
              { key: "growthRate", header: "Growth" },
              { key: "competitivePosition", header: "Position" },
            ]}
            rows={view.marketLeaders}
          />
        </Panel>

        <Panel title="Competitive Threats">
          <DataTable
            columns={[
              { key: "competitorName", header: "Competitor" },
              { key: "title", header: "Threat" },
              { key: "threatLevel", header: "Level" },
              { key: "severity", header: "Severity" },
              { key: "mitigation", header: "Mitigation" },
            ]}
            rows={view.competitiveThreats}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Competitive Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "competitorName", header: "Competitor" },
              { key: "opportunityLevel", header: "Level" },
              { key: "exploitStrategy", header: "Strategy" },
            ]}
            rows={view.competitiveOpportunities}
          />
        </Panel>

        <Panel title="Strategic Position">
          <DataTable
            columns={[
              { key: "dimension", header: "Dimension" },
              { key: "empireScore", header: "EmpireAI" },
              { key: "topCompetitor", header: "Top Rival" },
              { key: "competitorScore", header: "Rival Score" },
              { key: "gap", header: "Gap" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.strategicPosition}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strength Comparison">
          <DataTable
            columns={[
              { key: "competitorName", header: "Competitor" },
              { key: "strength", header: "Strength" },
              { key: "empirePosition", header: "EmpireAI" },
              { key: "competitorPosition", header: "Competitor" },
              { key: "advantage", header: "Advantage" },
            ]}
            rows={view.strengthComparisons}
          />
        </Panel>

        <Panel title="Weakness Comparison">
          <DataTable
            columns={[
              { key: "competitorName", header: "Competitor" },
              { key: "weakness", header: "Weakness" },
              { key: "empireExploit", header: "EmpireAI Exploit" },
              { key: "opportunity", header: "Opportunity" },
            ]}
            rows={view.weaknessComparisons}
          />
        </Panel>
      </div>

      <Panel title="Competitor Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.competitorAnalysis}
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

      <Panel title="Competitor Intelligence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.competitorIntelligencePipeline}
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
        <Panel title="Competitor Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.competitorPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Competitor Domains">
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
