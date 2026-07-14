"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveConfidenceEngine } from "@/lib/executive-confidence-engine/useExecutiveConfidenceEngine";

function formatLevel(level: string): string {
  return level.replace(/_/g, " ");
}

/** Compact Executive Confidence Engine strip for Executive Home. */
export function ExecutiveConfidenceEngineStrip() {
  const { view, loading, live } = useExecutiveConfidenceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Confidence Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-14 Confidence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-confidence" className="text-xs text-[#d4af37] hover:underline">
          Confidence panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Assessed</p>
          <p className="text-sm text-[#d4af37]">{view.assessedDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Avg Score</p>
          <p className="text-sm text-emerald-300">{view.averageConfidenceScore}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Confidence Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.confidenceHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-14 — Permanent Executive Confidence Engine panel. */
export function ExecutiveConfidenceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveConfidenceEngine();

  if (loading && !view) {
    return <Panel title="Executive Confidence">Loading executive confidence engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Confidence" subtitle="E2-14 · Executive Confidence Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-14 Executive Confidence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE215 && (
            <Link href="/cockpit/founder/autonomous-decision-monitor">
              <Badge variant="gold">E2-15 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/decision-audit" className="text-xs text-[#d4af37] hover:underline">
            Decision Audit →
          </Link>
          <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
            Executive Recommendations →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Confidence Health" value={view.confidenceHealth} />
        <StatCard label="Avg Confidence" value={`${view.averageConfidenceScore}%`} />
        <StatCard label="Assessed Decisions" value={String(view.assessedDecisionCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="High Confidence" value={String(view.highConfidenceCount)} />
        <StatCard label="Moderate Confidence" value={String(view.moderateConfidenceCount)} />
        <StatCard label="Low Confidence" value={String(view.lowConfidenceCount)} />
      </div>

      <Panel title="Current Decisions — Confidence Assessments">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "category", header: "Category" },
            { key: "confidenceScore", header: "Score" },
            { key: "confidenceLevel", header: "Level" },
            { key: "evidenceStrength", header: "Evidence" },
            { key: "historicalAccuracy", header: "Historical %" },
            { key: "riskInfluence", header: "Risk" },
            { key: "trend", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.confidenceAssessments.map((a) => ({
            ...a,
            category: a.category.replace(/_/g, " "),
            confidenceLevel: formatLevel(a.confidenceLevel),
            historicalAccuracy: `${a.historicalAccuracy}%`,
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Confidence Trend">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "previousScore", header: "Previous" },
              { key: "currentScore", header: "Current" },
              { key: "trend", header: "Trend" },
              { key: "calibrationStatus", header: "Calibration" },
            ]}
            rows={view.confidenceTrends.slice(0, 12)}
          />
        </Panel>

        <Panel title="Confidence Drivers">
          <DataTable
            columns={[
              { key: "label", header: "Driver" },
              { key: "score", header: "Score" },
              { key: "influence", header: "Influence" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.confidenceDrivers}
          />
        </Panel>
      </div>

      <Panel title="Confidence Calibration">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "predictedConfidence", header: "Predicted %" },
            { key: "actualOutcome", header: "Outcome" },
            { key: "calibrationDelta", header: "Delta" },
            { key: "status", header: "Status" },
          ]}
          rows={view.confidenceCalibration}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "what", header: "What" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Confidence Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.confidencePipeline}
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
