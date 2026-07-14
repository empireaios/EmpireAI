"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useMarketIntelligenceEngine } from "@/lib/market-intelligence-engine/useMarketIntelligenceEngine";

/** Compact Market Intelligence Engine strip for Executive Home. */
export function MarketIntelligenceEngineStrip() {
  const { view, loading, live } = useMarketIntelligenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Market Intelligence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-01 Markets</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/market-intelligence" className="text-xs text-[#d4af37] hover:underline">
          Market intelligence →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Markets Monitored</p>
          <p className="text-sm text-[#d4af37]">{view.monitoredMarketCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Opportunities</p>
          <p className="text-sm text-sky-300">{view.opportunityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Opportunity</p>
          <p className="text-sm text-[#e8e0d0]">{view.averageOpportunityScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Intelligence Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.marketIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-01 — Permanent Market Intelligence Engine panel. */
export function MarketIntelligenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useMarketIntelligenceEngine();

  if (loading && !view) {
    return <Panel title="Market Intelligence">Loading market intelligence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Market Intelligence" subtitle="E4-01 · Market Intelligence Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-01 Market Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE402 && (
            <Link href="/cockpit/founder/competitor-intelligence">
              <Badge variant="gold">E4-02 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/financial-executive-certification" className="text-xs text-[#d4af37] hover:underline">
            E3 Certified →
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
        <StatCard label="Markets Monitored" value={String(view.monitoredMarketCount)} />
        <StatCard label="Opportunities" value={String(view.opportunityCount)} />
        <StatCard label="Risk Alerts" value={String(view.riskAlertCount)} />
        <StatCard label="Avg Opportunity" value={`${view.averageOpportunityScore}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Intelligence Health" value={view.marketIntelligenceHealth} />
        <StatCard label="Engine Health" value={view.engineHealth} />
      </div>

      <Panel title="Global Markets">
        <DataTable
          columns={[
            { key: "marketName", header: "Market" },
            { key: "category", header: "Category" },
            { key: "geographicScope", header: "Scope" },
            { key: "growthRate", header: "Growth" },
            { key: "marketSize", header: "Size" },
            { key: "opportunityScore", header: "Opportunity" },
            { key: "riskScore", header: "Risk" },
            { key: "strategicRelevance", header: "Relevance" },
          ]}
          rows={view.globalMarkets.map((m) => ({
            ...m,
            category: m.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Market Trends">
          <DataTable
            columns={[
              { key: "marketName", header: "Market" },
              { key: "trend", header: "Trend" },
              { key: "direction", header: "Direction" },
              { key: "momentum", header: "Momentum" },
              { key: "impact", header: "Impact" },
            ]}
            rows={view.marketTrends.slice(0, 12)}
          />
        </Panel>

        <Panel title="Emerging Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "marketName", header: "Market" },
              { key: "opportunityScore", header: "Score" },
              { key: "timeHorizon", header: "Horizon" },
              { key: "status", header: "Status" },
            ]}
            rows={view.emergingOpportunities}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Market Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "marketName", header: "Market" },
              { key: "riskScore", header: "Score" },
              { key: "severity", header: "Severity" },
              { key: "mitigation", header: "Mitigation" },
            ]}
            rows={view.marketRisks}
          />
        </Panel>

        <Panel title="Industry Movement">
          <DataTable
            columns={[
              { key: "industry", header: "Industry" },
              { key: "movement", header: "Movement" },
              { key: "direction", header: "Direction" },
              { key: "strategicImpact", header: "Impact" },
            ]}
            rows={view.industryMovement}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Economic Indicators">
          <DataTable
            columns={[
              { key: "indicator", header: "Indicator" },
              { key: "region", header: "Region" },
              { key: "currentValue", header: "Value" },
              { key: "trend", header: "Trend" },
              { key: "marketImpact", header: "Impact" },
            ]}
            rows={view.economicIndicators}
          />
        </Panel>

        <Panel title="Strategic Alerts">
          <DataTable
            columns={[
              { key: "title", header: "Alert" },
              { key: "severity", header: "Severity" },
              { key: "category", header: "Category" },
              { key: "recommendedAction", header: "Action" },
            ]}
            rows={view.strategicAlerts}
          />
        </Panel>
      </div>

      <Panel title="Market Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.marketAnalysis}
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

      <Panel title="Market Intelligence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.marketIntelligencePipeline}
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
        <Panel title="Market Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.marketPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Market Domains">
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
