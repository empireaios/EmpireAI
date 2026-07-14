"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useEnterpriseGovernanceFramework } from "@/lib/enterprise-governance-framework/useEnterpriseGovernanceFramework";

/** Compact Enterprise Governance Framework strip for Executive Home. */
export function EnterpriseGovernanceFrameworkStrip() {
  const { view, loading, live } = useEnterpriseGovernanceFramework();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Enterprise Governance Framework…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-violet-500/40 bg-gradient-to-r from-violet-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-01 Governance</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/enterprise-governance" className="text-xs text-[#d4af37] hover:underline">
          Governance panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Policies</p>
          <p className="text-sm text-[#d4af37]">{view.activeGovernancePolicyCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Compliance</p>
          <p className="text-sm text-violet-300">{view.policyComplianceRate}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Violations</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeViolationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Governance Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.governanceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-01 — Permanent Enterprise Governance Framework panel. */
export function EnterpriseGovernanceFrameworkDashboard() {
  const { view, loading, error, reload, live, data } = useEnterpriseGovernanceFramework();

  if (loading && !view) {
    return <Panel title="Enterprise Governance">Loading enterprise governance framework…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Enterprise Governance" subtitle="E5-01 · Enterprise Governance Framework">
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
          <Badge variant="gold">E5-01 Enterprise Governance Framework</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE502 && (
            <Link href="/cockpit/founder/executive-constitutional-monitor">
              <Badge variant="gold">E5-02 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-intelligence-certification" className="text-xs text-[#d4af37] hover:underline">
            E4 Certified →
          </Link>
          <Link href="/cockpit/founder/executive-decision-certification" className="text-xs text-[#d4af37] hover:underline">
            E2 Certified →
          </Link>
          <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
            Executive Policies →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.frameworkSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Governance Health" value={view.governanceHealth} />
        <StatCard label="Policy Compliance" value={`${view.policyComplianceRate}%`} />
        <StatCard label="Active Policies" value={String(view.activeGovernancePolicyCount)} />
        <StatCard label="Avg Confidence" value={`${view.averageGovernanceConfidence}%`} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active Violations" value={String(view.activeViolationCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Governance Hierarchy">
        <DataTable
          columns={[
            { key: "level", header: "Level" },
            { key: "title", header: "Authority" },
            { key: "scope", header: "Scope" },
            { key: "reportsTo", header: "Reports To" },
            { key: "status", header: "Status" },
          ]}
          rows={view.governanceHierarchy}
        />
      </Panel>

      <Panel title="Authority Structure">
        <DataTable
          columns={[
            { key: "role", header: "Role" },
            { key: "authorityLevel", header: "Authority" },
            { key: "scope", header: "Scope" },
            { key: "delegatedTo", header: "Delegated To" },
            { key: "escalationPath", header: "Escalation" },
            { key: "status", header: "Status" },
          ]}
          rows={view.authorityStructure}
        />
      </Panel>

      <Panel title="Governance Policies">
        <DataTable
          columns={[
            { key: "governanceName", header: "Policy" },
            { key: "category", header: "Category" },
            { key: "authorityLevel", header: "Authority" },
            { key: "priority", header: "Priority" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.governancePolicies}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Policy Compliance">
          <DataTable
            columns={[
              { key: "policyName", header: "Policy" },
              { key: "complianceRate", header: "Compliance %" },
              { key: "violations", header: "Violations" },
              { key: "status", header: "Status" },
            ]}
            rows={view.policyCompliance}
          />
        </Panel>

        <Panel title="Governance Violations">
          <DataTable
            columns={[
              { key: "title", header: "Violation" },
              { key: "severity", header: "Severity" },
              { key: "affectedSystem", header: "System" },
              { key: "status", header: "Status" },
            ]}
            rows={view.governanceViolations}
          />
        </Panel>
      </div>

      <Panel title="Executive Governance Decisions">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "decisionType", header: "Type" },
            { key: "authority", header: "Authority" },
            { key: "outcome", header: "Outcome" },
            { key: "status", header: "Status" },
          ]}
          rows={view.governanceDecisions}
        />
      </Panel>

      <Panel title="Governance Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.governanceAnalysis}
        />
      </Panel>

      <Panel title="Governance Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.governancePipeline}
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

      <Panel title="Pillow Governance Evaluations">
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
