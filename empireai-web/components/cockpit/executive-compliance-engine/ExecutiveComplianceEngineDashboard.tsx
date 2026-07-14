"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveComplianceEngine } from "@/lib/executive-compliance-engine/useExecutiveComplianceEngine";

/** Compact Executive Compliance Engine strip for Executive Home. */
export function ExecutiveComplianceEngineStrip() {
  const { view, loading, live } = useExecutiveComplianceEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Compliance Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-teal-500/40 bg-gradient-to-r from-teal-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-04 Compliance</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-compliance" className="text-xs text-[#d4af37] hover:underline">
          Compliance panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Compliance Score</p>
          <p className="text-sm text-[#d4af37]">{view.complianceScore}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Violations</p>
          <p className="text-sm text-teal-300">{view.activeViolationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical</p>
          <p className="text-sm text-[#e8e0d0]">{view.criticalViolationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Compliance Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.complianceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-04 — Permanent Executive Compliance Engine panel. */
export function ExecutiveComplianceEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveComplianceEngine();

  if (loading && !view) {
    return <Panel title="Executive Compliance Engine">Loading executive compliance engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Compliance Engine" subtitle="E5-04 · Executive Compliance">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-teal-500/50 bg-gradient-to-br from-teal-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-04 Executive Compliance Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE505 && (
            <Link href="/cockpit/founder/executive-ethics">
              <Badge variant="gold">E5-05 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-audit-engine" className="text-xs text-[#d4af37] hover:underline">
            E5-03 Audit →
          </Link>
          <Link href="/cockpit/founder/executive-constitutional-monitor" className="text-xs text-[#d4af37] hover:underline">
            E5-02 Constitutional →
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
        <StatCard label="Compliance Health" value={view.complianceHealth} />
        <StatCard label="Compliance Score" value={`${view.complianceScore}%`} />
        <StatCard label="Active Violations" value={String(view.activeViolationCount)} />
        <StatCard label="Critical Violations" value={String(view.criticalViolationCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fully Compliant" value={String(view.fullyCompliantCount)} />
        <StatCard label="Correction Progress" value={`${view.averageCorrectionProgress}%`} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Active Violations">
          <DataTable
            columns={[
              { key: "title", header: "Violation" },
              { key: "severity", header: "Severity" },
              { key: "classification", header: "Classification" },
              { key: "status", header: "Status" },
            ]}
            rows={view.activeViolations}
          />
        </Panel>

        <Panel title="Critical Violations">
          <DataTable
            columns={[
              { key: "title", header: "Violation" },
              { key: "severity", header: "Severity" },
              { key: "requiredCorrection", header: "Correction" },
              { key: "status", header: "Status" },
            ]}
            rows={view.criticalViolations}
          />
        </Panel>
      </div>

      <Panel title="Correction Progress">
        <DataTable
          columns={[
            { key: "title", header: "Action" },
            { key: "owner", header: "Owner" },
            { key: "progress", header: "Progress %" },
            { key: "dueDate", header: "Due" },
            { key: "status", header: "Status" },
          ]}
          rows={view.correctionProgress}
        />
      </Panel>

      <Panel title="Compliance Trends">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "currentScore", header: "Score" },
            { key: "direction", header: "Trend" },
            { key: "status", header: "Status" },
          ]}
          rows={view.complianceTrends}
        />
      </Panel>

      <Panel title="Compliance Records">
        <DataTable
          columns={[
            { key: "complianceCategory", header: "Category" },
            { key: "classification", header: "Classification" },
            { key: "violationSeverity", header: "Severity" },
            { key: "confidence", header: "Confidence" },
            { key: "validationStatus", header: "Status" },
          ]}
          rows={view.complianceRecords}
        />
      </Panel>

      <Panel title="Compliance Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.complianceAnalysis}
        />
      </Panel>

      <Panel title="Executive Compliance Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveCompliancePipeline}
        />
      </Panel>

      <Panel title="Compliance Policy Registry">
        <DataTable
          columns={[
            { key: "title", header: "Policy" },
            { key: "category", header: "Category" },
            { key: "version", header: "Version" },
            { key: "enabled", header: "Enabled" },
            { key: "severity", header: "Severity" },
          ]}
          rows={view.policyRegistry ?? []}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Continuous Monitoring">
          {view.monitoringStatus ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Real-time: {view.monitoringStatus.realTimeValidation}</p>
              <p>Drift: {view.monitoringStatus.driftDetection}</p>
              <p>Score: {view.monitoringStatus.complianceScore}%</p>
              <p>Active violations: {view.monitoringStatus.activeViolationCount}</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a847a]">Monitoring unavailable</p>
          )}
        </Panel>

        <Panel title="Compliance Scorecard">
          {view.complianceScorecard ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Grade: {view.complianceScorecard.grade}</p>
              <p>Score: {view.complianceScorecard.overallScore}%</p>
              <p>Correction progress: {view.complianceScorecard.correctionProgress}%</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a847a]">Scorecard unavailable</p>
          )}
        </Panel>
      </div>

      {view.executiveReport && (
        <Panel title="Executive Report">
          <p className="text-sm text-[#c8c0b0]">{view.executiveReport.executiveSummary}</p>
          <p className="mt-2 text-xs text-[#6f6a60]">Policy effectiveness: {view.executiveReport.policyEffectiveness}</p>
        </Panel>
      )}

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

      <Panel title="Pillow Compliance Evaluations">
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
