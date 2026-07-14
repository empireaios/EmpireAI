"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveBenchmarkEngine } from "@/lib/executive-benchmark-engine/useExecutiveBenchmarkEngine";

/** Compact Executive Benchmark Engine strip for Executive Home. */
export function ExecutiveBenchmarkEngineStrip() {
  const { view, loading, live } = useExecutiveBenchmarkEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Benchmark Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-12 Benchmark Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-benchmark" className="text-xs text-[#d4af37] hover:underline">
          Benchmarks →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Benchmarks</p>
          <p className="text-sm text-[#d4af37]">{view.activeBenchmarkCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Gaps</p>
          <p className="text-sm text-sky-300">{view.criticalGapCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Confidence</p>
          <p className="text-sm text-blue-300">{view.averageBenchmarkConfidence}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Benchmark Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.benchmarkIntelligenceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E4-12 — Permanent Executive Benchmark Engine panel. */
export function ExecutiveBenchmarkEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveBenchmarkEngine();

  if (loading && !view) {
    return <Panel title="Executive Benchmark Engine">Loading executive benchmark engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Benchmark Engine" subtitle="E4-12 · Executive Benchmark Engine">
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
          <Badge variant="gold">E4-12 Executive Benchmark Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE413 && (
            <Link href="/cockpit/founder/cross-business-intelligence" className="text-xs text-[#d4af37] hover:underline">
              <Badge variant="gold">Ready for E4-13 →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-pattern" className="text-xs text-[#d4af37] hover:underline">
            Pattern Engine →
          </Link>
          <Link href="/cockpit/founder/executive-insight" className="text-xs text-[#d4af37] hover:underline">
            Insight Engine →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Active Benchmarks" value={String(view.activeBenchmarkCount)} />
        <StatCard label="Critical Gaps" value={String(view.criticalGapCount)} />
        <StatCard label="Improvement Opportunities" value={String(view.improvementOpportunityCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageBenchmarkConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Benchmark Health" value={view.benchmarkIntelligenceHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Performance Benchmarks">
        <DataTable
          columns={[
            { key: "title", header: "Benchmark" },
            { key: "internalScore", header: "Internal" },
            { key: "externalScore", header: "External" },
            { key: "performanceGap", header: "Gap" },
            { key: "priority", header: "Priority" },
          ]}
          rows={view.performanceBenchmarks.map((b) => ({
            ...b,
            category: b.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Industry Ranking">
        <DataTable
          columns={[
            { key: "title", header: "Benchmark" },
            { key: "industryPosition", header: "Position" },
            { key: "internalScore", header: "Internal" },
            { key: "externalScore", header: "External" },
            { key: "rank", header: "Rank" },
          ]}
          rows={view.industryRanking.map((r) => ({
            ...r,
            industryPosition: r.industryPosition.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Performance Gaps">
          <DataTable
            columns={[
              { key: "title", header: "Benchmark" },
              { key: "performanceGap", header: "Gap" },
              { key: "priority", header: "Priority" },
              { key: "status", header: "Status" },
            ]}
            rows={view.performanceGaps.map((g) => ({
              ...g,
              status: g.status.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Improvement Opportunities">
          <DataTable
            columns={[
              { key: "title", header: "Benchmark" },
              { key: "improvementOpportunity", header: "Opportunity" },
              { key: "priority", header: "Priority" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.improvementOpportunities}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Competitive Position">
          <DataTable
            columns={[
              { key: "title", header: "Benchmark" },
              { key: "competitivePosition", header: "Position" },
              { key: "performanceGap", header: "Gap" },
              { key: "status", header: "Status" },
            ]}
            rows={view.competitivePosition.map((p) => ({
              ...p,
              competitivePosition: p.competitivePosition.replace(/_/g, " "),
              status: p.status.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Strategic Readiness">
          <DataTable
            columns={[
              { key: "title", header: "Benchmark" },
              { key: "readinessLevel", header: "Readiness" },
              { key: "internalScore", header: "Score" },
              { key: "confidence", header: "Confidence %" },
            ]}
            rows={view.strategicReadiness}
          />
        </Panel>
      </div>

      <Panel title="Trend Analysis">
        <DataTable
          columns={[
            { key: "title", header: "Benchmark" },
            { key: "trendDirection", header: "Trend" },
            { key: "gapTrend", header: "Gap Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.trendAnalysis.map((t) => ({
            ...t,
            gapTrend: t.gapTrend.replace(/_/g, " "),
          }))}
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

      <Panel title="Benchmark Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.benchmarkAnalysis}
        />
      </Panel>

      <Panel title="Benchmark Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.benchmarkPipeline}
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
        <Panel title="Benchmark Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.benchmarkPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Benchmark Domains">
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
