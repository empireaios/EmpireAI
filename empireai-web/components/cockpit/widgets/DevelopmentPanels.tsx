"use client";

import { ActionButton, DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  DEVELOPMENT_APPROVALS,
  DEVELOPMENT_INSPECTION,
  DEVELOPMENT_LEARNING,
  DEVELOPMENT_PILLOW_SESSIONS,
} from "@/components/cockpit/widgets/governance/governanceDemoData";

/** SCR-800 — Development Pillow (REAL-123). */
export function DevelopmentPillowPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Open Pillow chat</ActionButton>
      <Panel title="Pillow Sessions" subtitle="Executive companion — demo">
        <DataTable
          keyField="id"
          data={DEVELOPMENT_PILLOW_SESSIONS}
          columns={[
            { key: "title", header: "Session" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "updated", header: "Updated" },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-801 — Development Approvals. */
export function DevelopmentApprovalsPanel() {
  return (
    <Panel title="Development Approvals" subtitle="Merge target: Mission Centre">
      <DataTable
        keyField="id"
        data={DEVELOPMENT_APPROVALS}
        columns={[
          { key: "title", header: "Approval" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </Panel>
  );
}

/** SCR-802 — Development ESIS Inspection. */
export function DevelopmentInspectionPanel() {
  return (
    <Panel title="ESIS Inspection" subtitle="Empire self-inspection dashboard">
      <DataTable
        keyField="id"
        data={DEVELOPMENT_INSPECTION}
        columns={[
          { key: "module", header: "Module" },
          { key: "compliance", header: "Compliance" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
        ]}
      />
    </Panel>
  );
}

/** SCR-803 — Development Executive Learning. */
export function DevelopmentLearningPanel() {
  return (
    <Panel title="Executive Learning" subtitle="Learning review queue">
      <DataTable
        keyField="id"
        data={DEVELOPMENT_LEARNING}
        columns={[
          { key: "topic", header: "Topic" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "score", header: "Score" },
        ]}
      />
    </Panel>
  );
}
