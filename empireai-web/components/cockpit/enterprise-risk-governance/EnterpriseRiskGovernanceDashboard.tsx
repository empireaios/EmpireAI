"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterpriseRiskGovernance } from "@/lib/enterprise-risk-governance/useEnterpriseRiskGovernance";

/** Compact Enterprise Risk Governance strip for Executive Home. */
export function EnterpriseRiskGovernanceStrip() {
  const { view, loading, live } = useEnterpriseRiskGovernance();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Risk Governance…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-09 Risk Governance</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-risk-governance" className="text-xs text-[#d4af37] hover:underline">
          Risk panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Total Risks</p>
          <p className="text-sm text-[#d4af37]">{view.totalRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical</p>
          <p className="text-sm text-amber-300">{view.criticalRiskCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Mitigating</p>
          <p className="text-sm text-[#e8e0d0]">{view.mitigationInProgressCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Risk Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.riskHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-09 — Permanent Enterprise Risk Governance panel. */
export function EnterpriseRiskGovernanceDashboard() {
  const { view, loading, error, reload, live, data } = useEnterpriseRiskGovernance();

  if (loading && !view) {
    return <Panel title="Enterprise Risk Governance">Loading enterprise risk governance…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Risk Governance" subtitle="E5-09 · Enterprise Risks">
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
          <Badge variant="gold">E5-09 Enterprise Risk Governance</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE510 && (
            <Link href="/cockpit/founder/executive-review-board" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-10 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-exception-manager" className="text-xs text-[#d4af37] hover:underline">
            E5-08 Exceptions →
          </Link>
          <Link href="/cockpit/founder/executive-transparency" className="text-xs text-[#d4af37] hover:underline">
            E5-07 Transparency →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Risk Health" value={view.riskHealth} />
        <StatCard label="Total Risks" value={String(view.totalRiskCount)} />
        <StatCard label="Critical Risks" value={String(view.criticalRiskCount)} />
        <StatCard label="High Risks" value={String(view.highRiskCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unmanaged Critical" value={String(view.unmanagedCriticalCount)} />
        <StatCard label="Mitigating" value={String(view.mitigationInProgressCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Critical Risks">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "owner", header: "Owner" },
              { key: "severity", header: "Severity" },
              { key: "mitigationProgress", header: "Progress" },
            ]}
            rows={view.criticalRisks}
          />
        </Panel>

        <Panel title="Risk Heat Map">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "probability", header: "Probability" },
              { key: "severity", header: "Severity" },
              { key: "exposureScore", header: "Exposure" },
            ]}
            rows={view.riskHeatMap}
          />
        </Panel>
      </div>

      <Panel title="Enterprise Risk Register">
        <DataTable
          columns={[
            { key: "riskTitle", header: "Risk" },
            { key: "category", header: "Category" },
            { key: "owner", header: "Owner" },
            { key: "severity", header: "Severity" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseRiskRegister}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mitigation Progress">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "owner", header: "Owner" },
              { key: "progress", header: "Progress" },
              { key: "status", header: "Status" },
            ]}
            rows={view.mitigationProgress}
          />
        </Panel>

        <Panel title="Risk Trends">
          <DataTable
            columns={[
              { key: "title", header: "Risk" },
              { key: "trend", header: "Trend" },
              { key: "velocity", header: "Velocity" },
              { key: "direction", header: "Direction" },
            ]}
            rows={view.riskTrends}
          />
        </Panel>
      </div>

      <Panel title="Executive Ownership">
        <DataTable
          columns={[
            { key: "title", header: "Risk" },
            { key: "owner", header: "Owner" },
            { key: "accountability", header: "Accountability" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveOwnership}
        />
      </Panel>

      <Panel title="Risk Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.riskAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Background Monitoring">
          {view.monitoringStatus ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Monitoring: {view.monitoringStatus.backgroundMonitoring}</p>
              <p>Critical: {view.monitoringStatus.criticalCount}</p>
              <p>High: {view.monitoringStatus.highCount}</p>
              <p>Unmanaged critical: {view.monitoringStatus.unmanagedCriticalCount}</p>
              <p>Mitigating: {view.monitoringStatus.mitigationInProgressCount}</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a847a]">Monitoring unavailable</p>
          )}
        </Panel>

        <Panel title="Risk Metrics">
          {view.metrics ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Total: {view.metrics.totalRisks}</p>
              <p>Critical: {view.metrics.criticalCount}</p>
              <p>High: {view.metrics.highCount}</p>
              <p>Mitigating: {view.metrics.mitigatingCount}</p>
              <p>Avg mitigation: {view.metrics.averageMitigationProgress}%</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a847a]">Metrics unavailable</p>
          )}
        </Panel>
      </div>

      {view.executiveReport && (
        <Panel title="Executive Report">
          <p className="text-sm text-[#c8c0b0]">{view.executiveReport.executiveSummary}</p>
          <p className="mt-2 text-xs text-[#6f6a60]">
            Critical: {view.executiveReport.criticalRisks} · Mitigated: {view.executiveReport.mitigatedCount}
          </p>
        </Panel>
      )}

      <Panel title="Enterprise Risk Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseRiskPipeline}
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

      <Panel title="Pillow Risk Evaluations">
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
