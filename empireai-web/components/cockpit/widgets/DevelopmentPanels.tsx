"use client";

import { DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import type { ExecutiveAuditView } from "@/lib/cockpit/panel-types";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { EngineCenterLayout } from "@/components/cockpit/widgets/EnginePanelFrame";

/** G4-04 — Pillow Supervisor Engine Center (secondary on SCR-800 Supervisor tab). */
export function DevelopmentPillowPanel() {
  return <EngineCenterLayout engineId="pillow-supervisor" />;
}

/** SCR-802 — ESIS Executive Audit (live). */
export function DevelopmentInspectionPanel() {
  const { data, loading, error, reload } = useBrainModule<ExecutiveAuditView>("cockpit-audit");

  if (loading) {
    return <Panel title="ESIS Inspection">Loading executive audit…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="ESIS Inspection">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const domains = [
    { label: "System", ...data.esis.systemHealth },
    { label: "Commerce", ...data.esis.commerceHealth },
    {
      label: "Production",
      state: (data.esis as { productionReadiness?: { state: string; score: number; summary: string } }).productionReadiness?.state ?? "UNKNOWN",
      score: (data.esis as { productionReadiness?: { state: string; score: number; summary: string } }).productionReadiness?.score ?? 0,
      summary: (data.esis as { productionReadiness?: { state: string; score: number; summary: string } }).productionReadiness?.summary ?? "ESIS production readiness",
    },
  ];

  return (
    <div className="space-y-6">
      <Panel title="ESIS Inspection" subtitle="Live · empire-self-inspection">
        <DataModeBadge mode="live" />
        <DataTable
          keyField="label"
          data={domains}
          columns={[
            { key: "label", header: "Domain" },
            { key: "state", header: "State", render: (r) => <StatusBadge status={r.state.toLowerCase()} /> },
            { key: "score", header: "Score", render: (r) => `${r.score}%` },
            { key: "summary", header: "Summary" },
          ]}
        />
      </Panel>
      <Panel title="B6 Credential Tracker" subtitle="Live">
        <p className="mb-2 text-sm text-[#c8c0b0]">{data.b6.nextHighestImpactAction}</p>
        <DataTable
          keyField="id"
          data={data.b6.items}
          columns={[
            { key: "id", header: "Item" },
            { key: "label", header: "Objective" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status.toLowerCase()} /> },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-801 — Approvals inbox routes to Mission Centre data. */
export function DevelopmentApprovalsPanel() {
  const { data, loading, error, reload } = useBrainModule<import("@/lib/cockpit/panel-types").MissionCentreView>(
    "cockpit-missions",
  );

  if (loading) {
    return <Panel title="Development Approvals">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Development Approvals">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="Approval Inbox" subtitle="Live · shared with Mission Centre">
      {data.pendingApprovals.length === 0 ? (
        <p className="text-sm text-[#6f6a60]">No pending approvals.</p>
      ) : (
        <DataTable
          keyField="approvalId"
          data={data.pendingApprovals}
          columns={[
            { key: "title", header: "Approval" },
            { key: "summary", header: "Summary" },
            { key: "type", header: "Type" },
          ]}
        />
      )}
    </Panel>
  );
}

/** SCR-803 — Executive Learning (not yet implemented). */
export function DevelopmentLearningPanel() {
  return (
    <Panel title="Executive Learning" subtitle="Capability not yet implemented">
      <p className="text-sm text-[#8a847a]">
        Executive learning review queue is not wired in G4-02. Soul learning review module exists in
        backend — wiring deferred to a future mission.
      </p>
    </Panel>
  );
}
