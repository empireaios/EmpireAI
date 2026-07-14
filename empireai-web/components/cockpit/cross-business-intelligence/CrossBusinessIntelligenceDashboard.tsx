"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCrossBusinessIntelligence } from "@/lib/cross-business-intelligence/useCrossBusinessIntelligence";

/** Compact Cross-Business Intelligence strip for Executive Home. */
export function CrossBusinessIntelligenceStrip() {
  const { view, loading, live } = useCrossBusinessIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Cross-Business Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-13 Cross-Business</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/cross-business-intelligence" className="text-xs text-[#d4af37] hover:underline">
          Cross-Business →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Relationships</p>
          <p className="text-sm text-[#d4af37]">{view.activeRelationshipCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Synergies</p>
          <p className="text-sm text-rose-300">{view.synergyCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Knowledge Flows</p>
          <p className="text-sm text-pink-300">{view.knowledgeSharingCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Intelligence Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.crossBusinessIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-13 — Permanent Cross-Business Intelligence panel. */
export function CrossBusinessIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useCrossBusinessIntelligence();

  if (loading && !view) {
    return <Panel title="Cross-Business Intelligence">Loading cross-business intelligence…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Cross-Business Intelligence" subtitle="E4-13 · Cross-Business Intelligence">
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
          <Badge variant="gold">E4-13 Cross-Business Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE414 && (
            <Link href="/cockpit/founder/executive-advisory" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-14 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-benchmark" className="text-xs text-[#d4af37] hover:underline">
            Benchmark Engine →
          </Link>
          <Link href="/cockpit/founder/enterprise-pattern" className="text-xs text-[#d4af37] hover:underline">
            Pattern Engine →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Relationships" value={String(view.activeRelationshipCount)} />
        <StatCard label="Enterprise Synergies" value={String(view.synergyCount)} />
        <StatCard label="Knowledge Flows" value={String(view.knowledgeSharingCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageRelationshipConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Intelligence Health" value={view.crossBusinessIntelligenceHealth} />
        <StatCard label="Cross-Business Opportunities" value={String(view.crossBusinessOpportunityCount)} />
      </div>

      <Panel title="Business Relationships">
        <DataTable
          columns={[
            { key: "sourceBusiness", header: "Source" },
            { key: "targetBusiness", header: "Target" },
            { key: "relationshipType", header: "Type" },
            { key: "confidence", header: "Confidence %" },
            { key: "riskLevel", header: "Risk" },
          ]}
          rows={view.businessRelationships.map((r) => ({
            ...r,
            relationshipType: r.relationshipType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Enterprise Synergies">
          <DataTable
            columns={[
              { key: "sourceBusiness", header: "Source" },
              { key: "targetBusiness", header: "Target" },
              { key: "synergyType", header: "Type" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.enterpriseSynergies.map((s) => ({
              ...s,
              synergyType: s.synergyType.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Knowledge Sharing">
          <DataTable
            columns={[
              { key: "sourceBusiness", header: "Source" },
              { key: "targetBusiness", header: "Target" },
              { key: "reusePotential", header: "Reuse" },
              { key: "status", header: "Status" },
            ]}
            rows={view.knowledgeSharing}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cross-Business Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "opportunityValue", header: "Value" },
              { key: "confidence", header: "Confidence %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.crossBusinessOpportunities.map((o) => ({
              ...o,
              status: o.status.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Cross-Business Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "riskLevel", header: "Level" },
              { key: "businessImpact", header: "Impact" },
              { key: "status", header: "Status" },
            ]}
            rows={view.crossBusinessRisks}
          />
        </Panel>
      </div>

      <Panel title="Enterprise Patterns">
        <DataTable
          columns={[
            { key: "title", header: "Pattern" },
            { key: "businessesInvolved", header: "Businesses" },
            { key: "confidence", header: "Confidence %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterprisePatterns}
        />
      </Panel>

      <Panel title="Executive Intelligence">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.executiveIntelligence}
        />
      </Panel>

      <Panel title="Strategic Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.strategicRecommendations}
        />
      </Panel>

      <Panel title="Cross-Business Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.crossBusinessAnalysis}
        />
      </Panel>

      <Panel title="Cross-Business Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.crossBusinessPipeline}
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
        <Panel title="Cross-Business Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.crossBusinessPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Cross-Business Domains">
          <DataTable
            columns={[{ key: "domain", header: "Domain" }]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      {view.pillowAdvisory.length > 0 && (
        <Panel title="Pillow Advisory">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.pillowAdvisory.map((note) => (
              <li key={note}>
                <span className="text-[#d4af37]">•</span> {note}
              </li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  );
}
