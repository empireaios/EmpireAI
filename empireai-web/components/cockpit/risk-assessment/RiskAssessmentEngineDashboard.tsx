"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useRiskAssessmentEngine } from "@/lib/risk-assessment-engine/useRiskAssessmentEngine";

/** Compact Risk Assessment Engine strip for Executive Home. */
export function RiskAssessmentEngineStrip() {
  const { view, loading, live } = useRiskAssessmentEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Risk Assessment Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/30 bg-gradient-to-r from-amber-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-02 Risks</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/decision-simulation" className="text-xs text-[#d4af37] hover:underline">
          Decision Simulation →
        </Link>
        <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
          Risk panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Risks</p>
          <p className="text-sm text-[#d4af37]">{view.activeRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical / High</p>
          <p className="text-sm text-amber-300">{view.criticalRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-02 — Permanent Risk Assessment Engine panel. */
export function RiskAssessmentEngineDashboard() {
  const { view, loading, error, reload, live, data } = useRiskAssessmentEngine();

  if (loading && !view) {
    return <Panel title="Risk Assessment">Loading risk assessment engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Risk Assessment" subtitle="E2-02 · Risk Assessment Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/40 bg-gradient-to-br from-amber-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-02 Risk Assessment</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE203 && <Badge variant="gold">E2-03 Active</Badge>}
          <Link href="/cockpit/founder/decision-simulation" className="text-xs text-[#d4af37] hover:underline">
            Decision Simulation →
          </Link>
          <Link href="/cockpit/founder/decision-architecture" className="text-xs text-[#d4af37] hover:underline">
            Decision Architecture →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Risks" value={String(view.activeRiskCount)} />
        <StatCard label="Critical / High" value={String(view.criticalRiskCount)} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Critical Risks">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Risk" },
            { key: "severity", header: "Severity" },
            { key: "overallRiskScore", header: "Score" },
            { key: "mitigationStatus", header: "Mitigation" },
            { key: "owner", header: "Owner" },
          ]}
          rows={view.criticalRisks}
        />
      </Panel>

      <Panel title="Current Risks">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "overallRiskScore", header: "Score" },
            { key: "probability", header: "Probability" },
            { key: "impact", header: "Impact" },
            { key: "residualRisk", header: "Residual" },
            { key: "trend", header: "Trend" },
          ]}
          rows={view.currentRisks.map((r) => ({
            ...r,
            category: r.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Risk Scores">
          <DataTable
            columns={[
              { key: "label", header: "Dimension" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
            ]}
            rows={view.riskScores}
          />
        </Panel>

        <Panel title="Risk Trends">
          <DataTable
            columns={[
              { key: "period", header: "Period" },
              { key: "criticalCount", header: "Critical" },
              { key: "highCount", header: "High" },
              { key: "mediumCount", header: "Medium" },
              { key: "overallScore", header: "Overall" },
            ]}
            rows={view.riskTrends}
          />
        </Panel>
      </div>

      <Panel title="Mitigation Status">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "mitigationPlan", header: "Mitigation Plan" },
            { key: "status", header: "Status" },
            { key: "residualRisk", header: "Residual" },
            { key: "progress", header: "Progress %" },
          ]}
          rows={view.mitigationStatus}
        />
      </Panel>

      <Panel title="Risk Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.riskPipeline}
        />
      </Panel>

      <Panel title="Recommendations">
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
