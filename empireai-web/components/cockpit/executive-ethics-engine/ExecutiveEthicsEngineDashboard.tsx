"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveEthicsEngine } from "@/lib/executive-ethics-engine/useExecutiveEthicsEngine";

/** Compact Executive Ethics Engine strip for Executive Home. */
export function ExecutiveEthicsEngineStrip() {
  const { view, loading, live } = useExecutiveEthicsEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Ethics Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-05 Ethics</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-ethics" className="text-xs text-[#d4af37] hover:underline">
          Ethics panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Ethics Rating</p>
          <p className="text-sm text-[#d4af37]">{view.executiveEthicsRating}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Assessments</p>
          <p className="text-sm text-violet-300">{view.ethicalAssessmentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Ethical Risks</p>
          <p className="text-sm text-[#e8e0d0]">{view.ethicalRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Ethics Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.ethicsHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-05 — Permanent Executive Ethics Engine panel. */
export function ExecutiveEthicsEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveEthicsEngine();

  if (loading && !view) {
    return <Panel title="Executive Ethics Engine">Loading executive ethics engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Ethics Engine" subtitle="E5-05 · Executive Ethics">
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
          <Badge variant="gold">E5-05 Executive Ethics Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE506 && (
            <Link href="/cockpit/founder/executive-accountability">
              <Badge variant="gold">E5-06 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-compliance" className="text-xs text-[#d4af37] hover:underline">
            E5-04 Compliance →
          </Link>
          <Link href="/cockpit/founder/enterprise-audit-engine" className="text-xs text-[#d4af37] hover:underline">
            E5-03 Audit →
          </Link>
          <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
            E2-12 Policies →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Ethics Health" value={view.ethicsHealth} />
        <StatCard label="Executive Ethics Rating" value={`${view.executiveEthicsRating}%`} />
        <StatCard label="Ethical Assessments" value={String(view.ethicalAssessmentCount)} />
        <StatCard label="Ethical Risks" value={String(view.ethicalRiskCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fully Ethical" value={String(view.fullyEthicalCount)} />
        <StatCard label="Critical Risks" value={String(view.criticalEthicalRiskCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Ethical Assessments">
        <DataTable
          columns={[
            { key: "executiveAction", header: "Executive Action" },
            { key: "category", header: "Category" },
            { key: "ethicsRating", header: "Rating" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.ethicalAssessments}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Potential Ethical Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "severity", header: "Severity" },
              { key: "classification", header: "Classification" },
              { key: "status", header: "Status" },
            ]}
            rows={view.potentialEthicalRisks}
          />
        </Panel>

        <Panel title="Ethics Trends">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "currentRating", header: "Rating" },
              { key: "direction", header: "Trend" },
              { key: "status", header: "Status" },
            ]}
            rows={view.ethicsTrends}
          />
        </Panel>
      </div>

      <Panel title="Ethics Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.ethicsAnalysis}
        />
      </Panel>

      <Panel title="Executive Ethics Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveEthicsPipeline}
        />
      </Panel>

      <Panel title="Executive Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "confidencePercent", header: "Confidence" },
            { key: "what", header: "Action" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Pillow Ethics Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>
    </div>
  );
}
