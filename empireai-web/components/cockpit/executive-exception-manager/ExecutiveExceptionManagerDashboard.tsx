"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveExceptionManager } from "@/lib/executive-exception-manager/useExecutiveExceptionManager";

/** Compact Executive Exception Manager strip for Executive Home. */
export function ExecutiveExceptionManagerStrip() {
  const { view, loading, live } = useExecutiveExceptionManager();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Exception Manager…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-08 Exceptions</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-exception-manager" className="text-xs text-[#d4af37] hover:underline">
          Exception panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeExceptionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-rose-300">{view.pendingApprovalCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Expiring Soon</p>
          <p className="text-sm text-[#e8e0d0]">{view.expiringSoonCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Exception Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.exceptionHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-08 — Permanent Executive Exception Manager panel. */
export function ExecutiveExceptionManagerDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveExceptionManager();

  if (loading && !view) {
    return <Panel title="Executive Exception Manager">Loading executive exception manager…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Exception Manager" subtitle="E5-08 · Executive Exceptions">
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
          <Badge variant="gold">E5-08 Executive Exception Manager</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE509 && (
            <Link href="/cockpit/founder/enterprise-risk-governance" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-09 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-transparency" className="text-xs text-[#d4af37] hover:underline">
            E5-07 Transparency →
          </Link>
          <Link href="/cockpit/founder/executive-accountability" className="text-xs text-[#d4af37] hover:underline">
            E5-06 Accountability →
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
        <StatCard label="Exception Health" value={view.exceptionHealth} />
        <StatCard label="Active Exceptions" value={String(view.activeExceptionCount)} />
        <StatCard label="Pending Approvals" value={String(view.pendingApprovalCount)} />
        <StatCard label="Expiring Soon" value={String(view.expiringSoonCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unauthorized" value={String(view.unauthorizedExceptionCount)} />
        <StatCard label="Exception Records" value={String(view.exceptionRecordCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Active Exceptions">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "approvingAuthority", header: "Authority" },
              { key: "riskLevel", header: "Risk" },
              { key: "expirationDate", header: "Expires" },
            ]}
            rows={view.activeExceptions}
          />
        </Panel>

        <Panel title="Pending Approvals">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "reason", header: "Reason" },
              { key: "riskLevel", header: "Risk" },
              { key: "status", header: "Status" },
            ]}
            rows={view.pendingApprovals}
          />
        </Panel>
      </div>

      <Panel title="Exception Timeline">
        <DataTable
          columns={[
            { key: "event", header: "Event" },
            { key: "authority", header: "Authority" },
            { key: "status", header: "Status" },
            { key: "timestamp", header: "Date" },
          ]}
          rows={view.exceptionTimeline}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Expiration Schedule">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "expirationDate", header: "Expires" },
              { key: "daysRemaining", header: "Days Left" },
              { key: "status", header: "Status" },
            ]}
            rows={view.expirationSchedule}
          />
        </Panel>

        <Panel title="Business Impact">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "businessImpact", header: "Business Impact" },
              { key: "riskLevel", header: "Risk" },
              { key: "status", header: "Status" },
            ]}
            rows={view.businessImpact}
          />
        </Panel>
      </div>

      <Panel title="Risk Assessment">
        <DataTable
          columns={[
            { key: "title", header: "Exception" },
            { key: "riskLevel", header: "Risk Level" },
            { key: "riskExposure", header: "Exposure" },
            { key: "mitigation", header: "Mitigation" },
          ]}
          rows={view.riskAssessment}
        />
      </Panel>

      <Panel title="Exception Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.exceptionAnalysis}
        />
      </Panel>

      <Panel title="Exception Policy Registry">
        <DataTable
          columns={[
            { key: "title", header: "Policy" },
            { key: "domain", header: "Domain" },
            { key: "version", header: "Version" },
            { key: "enabled", header: "Enabled" },
            { key: "severity", header: "Severity" },
          ]}
          rows={view.exceptionPolicies ?? []}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Escalation Workflows">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "level", header: "Level" },
              { key: "assignedTo", header: "Assigned To" },
              { key: "status", header: "Status" },
            ]}
            rows={view.escalationWorkflows ?? []}
          />
        </Panel>

        <Panel title="Recovery Workflows">
          <DataTable
            columns={[
              { key: "title", header: "Exception" },
              { key: "strategy", header: "Strategy" },
              { key: "progress", header: "Progress" },
              { key: "status", header: "Status" },
            ]}
            rows={view.recoveryWorkflows ?? []}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Background Monitoring">
          {view.monitoringStatus ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Monitoring: {view.monitoringStatus.backgroundMonitoring}</p>
              <p>Unresolved: {view.monitoringStatus.unresolvedCount}</p>
              <p>Expiring soon: {view.monitoringStatus.expiringSoonCount}</p>
              <p>Escalation pending: {view.monitoringStatus.escalationPendingCount}</p>
              <p>Last scan: {new Date(view.monitoringStatus.lastScanAt).toLocaleString()}</p>
            </div>
          ) : (
            <p className="text-sm text-[#8a847a]">Monitoring unavailable</p>
          )}
        </Panel>

        <Panel title="Exception Metrics">
          {view.metrics ? (
            <div className="space-y-2 text-sm text-[#c8c0b0]">
              <p>Total: {view.metrics.totalExceptions}</p>
              <p>Active: {view.metrics.activeCount}</p>
              <p>Pending: {view.metrics.pendingCount}</p>
              <p>Escalated: {view.metrics.escalatedCount}</p>
              <p>Resolved: {view.metrics.resolvedCount}</p>
              <p>Avg resolution: {view.metrics.averageResolutionDays} days</p>
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
            Active: {view.executiveReport.activeExceptions} · Pending: {view.executiveReport.pendingApprovals} · Resolved: {view.executiveReport.resolvedCount}
          </p>
        </Panel>
      )}

      <Panel title="Exception Audit History">
        <DataTable
          columns={[
            { key: "event", header: "Event" },
            { key: "actor", header: "Actor" },
            { key: "newStatus", header: "Status" },
            { key: "timestamp", header: "Date" },
          ]}
          rows={view.exceptionAuditHistory ?? []}
        />
      </Panel>

      <Panel title="Executive Exception Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveExceptionPipeline}
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

      <Panel title="Pillow Exception Evaluations">
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
