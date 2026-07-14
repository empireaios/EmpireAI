"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveConstitutionalMonitor } from "@/lib/executive-constitutional-monitor/useExecutiveConstitutionalMonitor";

/** Compact Executive Constitutional Monitor strip for Executive Home. */
export function ExecutiveConstitutionalMonitorStrip() {
  const { view, loading, live } = useExecutiveConstitutionalMonitor();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Constitutional Monitor…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/40 bg-gradient-to-r from-rose-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-02 Constitutional</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-constitutional-monitor" className="text-xs text-[#d4af37] hover:underline">
          Constitutional monitor →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Compliance</p>
          <p className="text-sm text-[#d4af37]">{view.constitutionalComplianceRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Validations</p>
          <p className="text-sm text-rose-300">{view.activeValidationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Violations</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeViolationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Constitution Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.constitutionalHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-02 — Permanent Executive Constitutional Monitor panel. */
export function ExecutiveConstitutionalMonitorDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveConstitutionalMonitor();

  if (loading && !view) {
    return <Panel title="Executive Constitutional Monitor">Loading constitutional monitor…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Constitutional Monitor" subtitle="E5-02 · Constitutional Validation">
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
          <Badge variant="gold">E5-02 Executive Constitutional Monitor</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE503 && (
            <Link href="/cockpit/founder/enterprise-audit-engine">
              <Badge variant="gold">E5-03 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/enterprise-governance" className="text-xs text-[#d4af37] hover:underline">
            E5-01 Governance →
          </Link>
          <Link href="/cockpit/founder/executive-intelligence-certification" className="text-xs text-[#d4af37] hover:underline">
            E4 Certified →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Constitution Health" value={view.constitutionalHealth} />
        <StatCard label="Compliance Rate" value={`${view.constitutionalComplianceRate}%`} />
        <StatCard label="Active Validations" value={String(view.activeValidationCount)} />
        <StatCard label="Active Violations" value={String(view.activeViolationCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fully Constitutional" value={String(view.fullyConstitutionalCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageValidationConfidence}%`} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Constitution Status">
        <DataTable
          columns={[
            { key: "constitutionLayer", header: "Layer" },
            { key: "alignment", header: "Alignment" },
            { key: "complianceRate", header: "Compliance %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.constitutionStatus}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Constitution Health by Domain">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "healthScore", header: "Health" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.constitutionHealth}
          />
        </Panel>

        <Panel title="Executive Compliance">
          <DataTable
            columns={[
              { key: "executiveAction", header: "Action" },
              { key: "complianceRate", header: "Compliance %" },
              { key: "classification", header: "Classification" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveCompliance}
          />
        </Panel>
      </div>

      <Panel title="Active Violations">
        <DataTable
          columns={[
            { key: "title", header: "Violation" },
            { key: "severity", header: "Severity" },
            { key: "classification", header: "Classification" },
            { key: "requiredCorrection", header: "Correction" },
            { key: "status", header: "Status" },
          ]}
          rows={view.activeViolations}
        />
      </Panel>

      <Panel title="Validation Queue">
        <DataTable
          columns={[
            { key: "executiveAction", header: "Action" },
            { key: "priority", header: "Priority" },
            { key: "estimatedResolution", header: "Resolution" },
            { key: "status", header: "Status" },
          ]}
          rows={view.validationQueue}
        />
      </Panel>

      <Panel title="Constitutional Validations">
        <DataTable
          columns={[
            { key: "executiveAction", header: "Executive Action" },
            { key: "classification", header: "Classification" },
            { key: "violationSeverity", header: "Severity" },
            { key: "confidence", header: "Confidence" },
            { key: "validationStatus", header: "Status" },
          ]}
          rows={view.constitutionalValidations}
        />
      </Panel>

      <Panel title="Constitutional Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.constitutionalAnalysis}
        />
      </Panel>

      <Panel title="Constitutional Validation Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.constitutionalValidationPipeline}
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

      <Panel title="Pillow Constitutional Evaluations">
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
