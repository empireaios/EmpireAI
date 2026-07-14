"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveKnowledgeGraph } from "@/lib/executive-knowledge-graph/useExecutiveKnowledgeGraph";

/** Compact Executive Knowledge Graph strip for Executive Home. */
export function ExecutiveKnowledgeGraphStrip() {
  const { view, loading, live } = useExecutiveKnowledgeGraph();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Knowledge Graph…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-08 Knowledge Graph</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-knowledge-graph" className="text-xs text-[#d4af37] hover:underline">
          Knowledge graph →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Entities</p>
          <p className="text-sm text-[#d4af37]">{view.entityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Relationships</p>
          <p className="text-sm text-amber-300">{view.relationshipCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strategic</p>
          <p className="text-sm text-orange-300">{view.strategicConnectionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Graph Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.knowledgeGraphHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-08 — Permanent Executive Knowledge Graph panel. */
export function ExecutiveKnowledgeGraphDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveKnowledgeGraph();

  if (loading && !view) {
    return <Panel title="Executive Knowledge Graph">Loading executive knowledge graph…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Knowledge Graph" subtitle="E4-08 · Executive Knowledge Graph">
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
          <Badge variant="gold">E4-08 Executive Knowledge Graph</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE409 && (
            <Link href="/cockpit/founder/executive-prediction" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-09 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/innovation-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Innovation Intelligence →
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
        <StatCard label="Knowledge Entities" value={String(view.entityCount)} />
        <StatCard label="Relationships" value={String(view.relationshipCount)} />
        <StatCard label="Strategic Connections" value={String(view.strategicConnectionCount)} />
        <StatCard label="Avg Relationship Strength" value={`${view.averageRelationshipStrength}/100`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Graph Health" value={view.knowledgeGraphHealth} />
        <StatCard label="Knowledge Gaps" value={String(view.knowledgeGapCount)} />
      </div>

      <Panel title="Knowledge Network">
        <DataTable
          columns={[
            { key: "entityName", header: "Entity" },
            { key: "entityType", header: "Type" },
            { key: "relationshipType", header: "Relationship" },
            { key: "relationshipStrength", header: "Strength" },
            { key: "strategicImportance", header: "Importance" },
          ]}
          rows={view.knowledgeNetwork.map((e) => ({
            ...e,
            relationshipType: e.relationshipType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Entity Relationships">
          <DataTable
            columns={[
              { key: "sourceEntityName", header: "Source" },
              { key: "targetEntityName", header: "Target" },
              { key: "relationshipType", header: "Type" },
              { key: "relationshipStrength", header: "Strength" },
            ]}
            rows={view.entityRelationships}
          />
        </Panel>

        <Panel title="Strategic Connections">
          <DataTable
            columns={[
              { key: "entityName", header: "Entity" },
              { key: "connectedEntity", header: "Connected To" },
              { key: "strategicImportance", header: "Importance" },
              { key: "relationshipStrength", header: "Strength" },
            ]}
            rows={view.strategicConnections}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Business Connections">
          <DataTable
            columns={[
              { key: "entityName", header: "Entity" },
              { key: "connectedEntity", header: "Connected To" },
              { key: "businessImpact", header: "Impact" },
            ]}
            rows={view.businessConnections}
          />
        </Panel>

        <Panel title="Knowledge Gaps">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "gapDescription", header: "Gap" },
              { key: "priority", header: "Priority" },
              { key: "status", header: "Status" },
            ]}
            rows={view.knowledgeGaps.map((g) => ({
              ...g,
              domain: g.domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Opportunity Network">
          <DataTable
            columns={[
              { key: "entityName", header: "Entity" },
              { key: "connectedOpportunities", header: "Opportunities" },
              { key: "networkStrength", header: "Strength" },
              { key: "strategicValue", header: "Value" },
            ]}
            rows={view.opportunityNetwork}
          />
        </Panel>

        <Panel title="Risk Network">
          <DataTable
            columns={[
              { key: "entityName", header: "Entity" },
              { key: "connectedRisks", header: "Risks" },
              { key: "networkStrength", header: "Strength" },
              { key: "severity", header: "Severity" },
            ]}
            rows={view.riskNetwork}
          />
        </Panel>
      </div>

      <Panel title="Knowledge Graph Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.knowledgeGraphAnalysis}
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

      <Panel title="Knowledge Graph Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.knowledgeGraphPipeline}
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
        <Panel title="Knowledge Graph Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.knowledgeGraphPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Knowledge Domains">
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
