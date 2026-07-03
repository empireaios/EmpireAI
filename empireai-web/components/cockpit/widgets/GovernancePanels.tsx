"use client";

import { ActionButton, DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { ExecutiveAuditView } from "@/lib/cockpit/panel-types";
import { GovernanceV1CertificationPanel } from "@/components/cockpit/widgets/FinancePanels";
import {
  GOVERNANCE_POLICIES,
  GOVERNANCE_RISKS,
} from "@/components/cockpit/widgets/governance/governanceDemoData";

/** SCR-702 — Governance Executive Audit / Decisions (G4-02 live). */
export function GovernanceExecutiveAuditPanel() {
  const { data, loading, error, reload } = useBrainModule<ExecutiveAuditView>("cockpit-audit");

  if (loading) {
    return <Panel title="Executive Audit Findings">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Executive Audit Findings">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const blockers = Object.values(data.certificationBlockers);

  return (
    <div className="space-y-6">
      <Panel title="Executive Audit Findings" subtitle="Live · cockpit-audit">
        <div className="mb-3">
          <DataModeBadge mode="live" />
        </div>
        <DataTable
          keyField="id"
          data={blockers}
          columns={[
            { key: "id", header: "Gate" },
            { key: "label", header: "Area" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "detail", header: "Finding" },
          ]}
        />
      </Panel>
      <Panel title="ESIS Summary" subtitle="Live · empire-self-inspection">
        <p className="text-sm text-[#c8c0b0]">{data.esis.systemHealth.summary}</p>
      </Panel>
    </div>
  );
}

/** SCR-700 — Governance Policies / Settings (demo data — not yet wired). */
export function GovernancePoliciesPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Save settings</ActionButton>
      <Panel title="Active Policies" subtitle="Capability not yet implemented">
        <p className="mb-4 text-sm text-[#8a847a]">
          Policy engine Brain dispatch is not wired in G4-02. Static doctrine preview only.
        </p>
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

/** SCR-701 — Governance Risk (demo data — not yet wired). */
export function GovernanceRiskPanel() {
  return (
    <Panel title="Risk Register" subtitle="Capability not yet implemented">
      <p className="mb-4 text-sm text-[#8a847a]">
        Risk register Brain dispatch is not wired in G4-02. Static preview only.
      </p>
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

/** SCR-704 — Governance Recovery / V1 Certification (G4-02 live audit). */
export function GovernanceRecoveryPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Recovery Plans" subtitle="Capability not yet implemented">
        <p className="text-sm text-[#8a847a]">
          Empire recovery doctrine panels are not yet wired to Brain. Demo recovery plans removed per
          G4-02 no-placeholder rule.
        </p>
      </Panel>
      <GovernanceV1CertificationPanel />
    </div>
  );
}

/** SCR-703 — Executive Council (not yet implemented). */
export function GovernanceCouncilPanel() {
  return (
    <Panel title="Executive Council" subtitle="Capability not yet implemented">
      <p className="text-sm text-[#8a847a]">
        Executive Council debate UI is not yet wired to Brain. Live council sessions ship in a future
        REAL mission.
      </p>
    </Panel>
  );
}

/** SCR-701 Soul chamber (not yet implemented). */
export function GovernanceSoulPanel() {
  return (
    <Panel title="Soul Decision Chamber" subtitle="Capability not yet implemented">
      <p className="text-sm text-[#8a847a]">
        Soul synthesizes council debate into unified recommendations. Live API port deferred — no
        placeholder data shown.
      </p>
    </Panel>
  );
}
