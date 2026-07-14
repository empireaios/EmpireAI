"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveInsightEngine } from "@/lib/executive-insight-engine/useExecutiveInsightEngine";

/** Compact Executive Insight Engine strip for Executive Home. */
export function ExecutiveInsightEngineStrip() {
  const { view, loading, live } = useExecutiveInsightEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Insight Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-cyan-500/40 bg-gradient-to-r from-cyan-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-10 Insight Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-insight" className="text-xs text-[#d4af37] hover:underline">
          Insights →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Insights</p>
          <p className="text-sm text-[#d4af37]">{view.activeInsightCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Priority</p>
          <p className="text-sm text-cyan-300">{view.criticalPriorityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-teal-300">{view.averageInsightConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Insight Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.insightIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-10 — Permanent Executive Insight Engine panel. */
export function ExecutiveInsightEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveInsightEngine();

  if (loading && !view) {
    return <Panel title="Executive Insight Engine">Loading executive insight engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Insight Engine" subtitle="E4-10 · Executive Insight Engine">
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
          <Badge variant="gold">E4-10 Executive Insight Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE411 && (
            <Link href="/cockpit/founder/enterprise-pattern" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-11 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-prediction" className="text-xs text-[#d4af37] hover:underline">
            Prediction Engine →
          </Link>
          <Link href="/cockpit/founder/executive-knowledge-graph" className="text-xs text-[#d4af37] hover:underline">
            Knowledge Graph →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Insights" value={String(view.activeInsightCount)} />
        <StatCard label="Critical Priority" value={String(view.criticalPriorityCount)} />
        <StatCard label="Strategic Findings" value={String(view.strategicFindingCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageInsightConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Insight Health" value={view.insightIntelligenceHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Executive Insights">
        <DataTable
          columns={[
            { key: "title", header: "Insight" },
            { key: "category", header: "Category" },
            { key: "priority", header: "Priority" },
            { key: "confidence", header: "Confidence %" },
            { key: "keyFinding", header: "Key Finding" },
          ]}
          rows={view.executiveInsights.map((i) => ({
            ...i,
            category: i.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Top Priorities">
        <DataTable
          columns={[
            { key: "title", header: "Priority" },
            { key: "priority", header: "Level" },
            { key: "urgency", header: "Urgency" },
            { key: "confidence", header: "Confidence %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.topPriorities.map((p) => ({
            ...p,
            urgency: p.urgency.replace(/_/g, " "),
            status: p.status.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Strategic Findings">
          <DataTable
            columns={[
              { key: "title", header: "Finding" },
              { key: "keyFinding", header: "Key Finding" },
              { key: "strategicImpact", header: "Impact" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.strategicFindings}
          />
        </Panel>

        <Panel title="Confidence Levels">
          <DataTable
            columns={[
              { key: "title", header: "Insight" },
              { key: "confidence", header: "Confidence %" },
              { key: "evidenceQuality", header: "Evidence" },
              { key: "validationStatus", header: "Validation" },
            ]}
            rows={view.confidenceLevels.map((c) => ({
              ...c,
              validationStatus: c.validationStatus.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Critical Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Opportunity" },
              { key: "opportunityValue", header: "Value" },
              { key: "confidence", header: "Confidence %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.criticalOpportunities.map((o) => ({
              ...o,
              status: o.status.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Critical Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "riskExposure", header: "Exposure" },
              { key: "confidence", header: "Confidence %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.criticalRisks}
          />
        </Panel>
      </div>

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

      <Panel title="Insight Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.insightAnalysis}
        />
      </Panel>

      <Panel title="Insight Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.insightPipeline}
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
        <Panel title="Insight Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.insightPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Insight Domains">
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
