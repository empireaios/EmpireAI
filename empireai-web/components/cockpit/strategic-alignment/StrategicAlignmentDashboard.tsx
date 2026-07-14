"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useStrategicAlignmentMonitor } from "@/lib/strategic-alignment-monitor/useStrategicAlignmentMonitor";

/** Compact Strategic Alignment strip for Executive Home. */
export function StrategicAlignmentStrip() {
  const { view, loading, live } = useStrategicAlignmentMonitor();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Strategic Alignment…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-13 Alignment</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/strategic-alignment" className="text-xs text-[#d4af37] hover:underline">
          Alignment panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Overall Alignment</p>
          <p className="text-sm text-[#d4af37]">{view.overallAlignmentScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Current Drift</p>
          <p className="line-clamp-1 text-sm text-[#e8e0d0]">{view.currentDrift}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Business Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.businessAlignment}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-13 — Permanent Strategic Alignment Monitor panel. */
export function StrategicAlignmentDashboard() {
  const { view, loading, error, reload, live, data } = useStrategicAlignmentMonitor();

  if (loading && !view) {
    return <Panel title="Strategic Alignment">Loading alignment monitor…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Strategic Alignment" subtitle="E1-13 · Strategic Alignment Monitor">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-13 Strategic Alignment</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE114 && <Badge variant="gold">Ready for E1-14</Badge>}
          <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
            Executive Planning Dashboard →
          </Link>
          <Link href="/cockpit/founder/opportunity-prioritization" className="text-xs text-[#d4af37] hover:underline">
            Opportunity Prioritization →
          </Link>
          <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
            Corporate Vision →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.monitorSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Alignment" value={`${view.overallAlignmentScore}/100`} />
        <StatCard label="Monitor Health" value={view.monitorHealth} />
        <StatCard label="Programme Alignment" value={view.programmeAlignment} />
        <StatCard label="Department Alignment" value={view.departmentAlignment} />
      </div>

      <Panel title="Current Drift">
        <p className="text-sm text-[#c8c0b0]">{view.currentDrift}</p>
        <DataTable
          columns={[
            { key: "label", header: "Drift" },
            { key: "scope", header: "Scope" },
            { key: "severity", header: "Severity" },
            { key: "deviationLevel", header: "Deviation" },
            { key: "correctiveAction", header: "Corrective Action" },
          ]}
          rows={view.driftDetections}
        />
      </Panel>

      <Panel title="Alignment Assessments">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "scope", header: "Scope" },
            { key: "currentAlignmentScore", header: "Score" },
            { key: "deviationLevel", header: "Deviation" },
            { key: "businessImpact", header: "Business" },
            { key: "strategicImpact", header: "Strategic" },
            { key: "riskLevel", header: "Risk" },
          ]}
          rows={view.alignmentAssessments.map((a) => ({
            ...a,
            domain: a.domain.replace(/_/g, " "),
            scope: a.scope.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Alignment Scoring">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.alignmentScoring}
          />
        </Panel>

        <Panel title="Alignment Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "overallScore", header: "Overall" },
              { key: "visionScore", header: "Vision" },
              { key: "programmeScore", header: "Programme" },
              { key: "trend", header: "Trend" },
            ]}
            rows={view.alignmentTrends}
          />
        </Panel>
      </div>

      <Panel title="Corrective Recommendations">
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

      <Panel title="Alignment Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.alignmentPipeline}
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
    </div>
  );
}
