"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterpriseAuditEngine } from "@/lib/enterprise-audit-engine/useEnterpriseAuditEngine";

/** Compact Enterprise Audit Engine strip for Executive Home. */
export function EnterpriseAuditEngineStrip() {
  const { view, loading, live } = useEnterpriseAuditEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Audit Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-orange-500/40 bg-gradient-to-r from-orange-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-03 Audit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-audit-engine" className="text-xs text-[#d4af37] hover:underline">
          Audit panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Coverage</p>
          <p className="text-sm text-[#d4af37]">{view.auditCoverageRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Audits</p>
          <p className="text-sm text-orange-300">{view.activeAuditCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Findings</p>
          <p className="text-sm text-[#e8e0d0]">{view.criticalFindingCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Audit Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.auditHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-03 — Permanent Enterprise Audit Engine panel. */
export function EnterpriseAuditEngineDashboard() {
  const { view, loading, error, reload, live, data } = useEnterpriseAuditEngine();

  if (loading && !view) {
    return <Panel title="Enterprise Audit Engine">Loading enterprise audit engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Audit Engine" subtitle="E5-03 · Enterprise Auditing">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-orange-500/50 bg-gradient-to-br from-orange-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-03 Enterprise Audit Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE504 && (
            <Link href="/cockpit/founder/executive-compliance">
              <Badge variant="gold">E5-04 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-constitutional-monitor" className="text-xs text-[#d4af37] hover:underline">
            E5-02 Constitutional →
          </Link>
          <Link href="/cockpit/founder/enterprise-governance" className="text-xs text-[#d4af37] hover:underline">
            E5-01 Governance →
          </Link>
          <Link href="/cockpit/founder/decision-audit" className="text-xs text-[#d4af37] hover:underline">
            E2-13 Decision Audit →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Audit Health" value={view.auditHealth} />
        <StatCard label="Audit Coverage" value={`${view.auditCoverageRate}%`} />
        <StatCard label="Active Audits" value={String(view.activeAuditCount)} />
        <StatCard label="Critical Findings" value={String(view.criticalFindingCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Open Corrective Actions" value={String(view.openCorrectiveActionCount)} />
        <StatCard label="Resolved Findings" value={String(view.resolvedFindingCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageAuditConfidence}%`} />
      </div>

      <Panel title="Audit Schedule">
        <DataTable
          columns={[
            { key: "auditName", header: "Audit" },
            { key: "frequency", header: "Frequency" },
            { key: "owner", header: "Owner" },
            { key: "status", header: "Status" },
          ]}
          rows={view.auditSchedule}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Critical Findings">
          <DataTable
            columns={[
              { key: "title", header: "Finding" },
              { key: "severity", header: "Severity" },
              { key: "correctiveAction", header: "Correction" },
              { key: "status", header: "Status" },
            ]}
            rows={view.criticalFindings}
          />
        </Panel>

        <Panel title="Corrective Actions">
          <DataTable
            columns={[
              { key: "title", header: "Action" },
              { key: "owner", header: "Owner" },
              { key: "progress", header: "Progress %" },
              { key: "dueDate", header: "Due" },
              { key: "status", header: "Status" },
            ]}
            rows={view.correctiveActions}
          />
        </Panel>
      </div>

      <Panel title="Audit Coverage">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "coverageRate", header: "Coverage %" },
            { key: "lastAudited", header: "Last Audited" },
            { key: "status", header: "Status" },
          ]}
          rows={view.auditCoverage}
        />
      </Panel>

      <Panel title="Enterprise Audit Records">
        <DataTable
          columns={[
            { key: "auditName", header: "Audit" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.auditRecords}
        />
      </Panel>

      <Panel title="Audit Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.auditAnalysis}
        />
      </Panel>

      <Panel title="Enterprise Audit Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.enterpriseAuditPipeline}
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

      <Panel title="Pillow Audit Evaluations">
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
