"use client";

import { ActionButton, DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  GOVERNANCE_AUDIT_ITEMS,
  GOVERNANCE_POLICIES,
  GOVERNANCE_RECOVERY_PLANS,
  GOVERNANCE_RISKS,
} from "@/components/cockpit/widgets/governance/governanceDemoData";

/** SCR-702 — Governance Executive Audit / Decisions (REAL-119). */
export function GovernanceExecutiveAuditPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Executive Audit Findings" subtitle="Governance signal review — demo">
        <DataTable
          keyField="id"
          data={GOVERNANCE_AUDIT_ITEMS}
          columns={[
            { key: "area", header: "Area" },
            { key: "finding", header: "Finding" },
            { key: "severity", header: "Severity", render: (r) => <StatusBadge status={r.severity} /> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-700 — Governance Policies / Settings (REAL-120). */
export function GovernancePoliciesPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Save settings</ActionButton>
      <Panel title="Active Policies" subtitle="Constitutional governance rules">
        <DataTable
          keyField="id"
          data={GOVERNANCE_POLICIES}
          columns={[
            { key: "name", header: "Policy" },
            { key: "scope", header: "Scope" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-701 — Governance Risk / Soul (REAL-121). */
export function GovernanceRiskPanel() {
  return (
    <Panel title="Risk Register" subtitle="Commercial and operational risk matrix">
      <DataTable
        keyField="id"
        data={GOVERNANCE_RISKS}
        columns={[
          { key: "risk", header: "Risk" },
          { key: "impact", header: "Impact", render: (r) => <StatusBadge status={r.impact} /> },
          { key: "likelihood", header: "Likelihood" },
          { key: "mitigation", header: "Mitigation" },
        ]}
      />
    </Panel>
  );
}

/** SCR-704 — Governance Recovery / V1 Certification (REAL-122). */
export function GovernanceRecoveryPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Recovery Plans" subtitle="Empire recovery doctrine — demo">
        <DataTable
          keyField="id"
          data={GOVERNANCE_RECOVERY_PLANS}
          columns={[
            { key: "scenario", header: "Scenario" },
            { key: "rto", header: "RTO" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "owner", header: "Owner" },
          ]}
        />
      </Panel>
      <Panel title="V1 Certification Readiness" subtitle="82% — blockers remain">
        <div className="flex h-24 items-center justify-center rounded-lg border border-dashed border-gold/20 text-sm text-[#6f6a60]">
          Success-001 command centre — REAL-113 roadmap port
        </div>
      </Panel>
    </div>
  );
}

/** SCR-703 — Executive Council placeholder. */
export function GovernanceCouncilPanel() {
  return (
    <Panel title="Executive Council" subtitle="Council debate — demo presentation">
      <p className="text-sm text-[#8a847a]">
        Executive visual debate panel will port from frontend in a future REAL mission. Demo mode only.
      </p>
    </Panel>
  );
}

/** SCR-701 Soul chamber placeholder for soul route. */
export function GovernanceSoulPanel() {
  return (
    <Panel title="Soul Decision Chamber" subtitle="Never auto-executes — demo">
      <p className="text-sm text-[#8a847a]">
        Soul synthesizes council debate into unified recommendations. Live API port deferred.
      </p>
    </Panel>
  );
}
