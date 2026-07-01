"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  WORKFORCE_ACTIVITY,
  WORKFORCE_AGENTS,
  WORKFORCE_MISSIONS,
} from "@/components/cockpit/widgets/workforce/workforceDemoData";

/** SCR-500 — AI Workforce Agents / Roster (REAL-112). */
export function WorkforceAgentsPanel() {
  const online = WORKFORCE_AGENTS.filter((a) => a.status === "online").length;
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Agents online" value={String(online)} change={`${WORKFORCE_AGENTS.length} total`} trend="up" />
        <StatCard label="Dispatches today" value="100" change="Demo activity" trend="neutral" />
        <StatCard label="Queue depth" value="11" change="Pending work" trend="neutral" />
      </div>
      <Panel title="Agent Roster" subtitle="AI workforce grid — demo presentation">
        <DataTable
          keyField="id"
          data={WORKFORCE_AGENTS}
          columns={[
            { key: "name", header: "Agent" },
            { key: "role", header: "Role" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "dispatches", header: "Dispatches" },
            { key: "queue", header: "Queue" },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-501 — AI Workforce Missions / Activity (REAL-113). */
export function WorkforceMissionsPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Agent Missions" subtitle="Assigned work queue — demo">
        <DataTable
          keyField="id"
          data={WORKFORCE_MISSIONS}
          columns={[
            { key: "title", header: "Mission" },
            { key: "agent", header: "Agent" },
            { key: "priority", header: "Priority", render: (r) => <StatusBadge status={r.priority} /> },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
      <Panel title="Recent Activity" subtitle="Agent dispatch log">
        <ul className="space-y-3 text-sm text-[#c8c0b0]">
          {WORKFORCE_ACTIVITY.map((a) => (
            <li key={a.id} className="rounded-lg border border-gold/10 px-4 py-3">
              <span className="text-[#6f6a60]">{a.time}</span> · <span className="text-[#d4af37]">{a.agent}</span> — {a.action}
            </li>
          ))}
        </ul>
      </Panel>
      <ActionButton disabled>Dispatch mission</ActionButton>
    </div>
  );
}

/** SCR-502 — AI Workforce Audit log. */
export function WorkforceAuditPanel() {
  return (
    <Panel title="Audit Log" subtitle="Brain audit client — REAL-127+ live path">
      <DataTable
        keyField="id"
        data={WORKFORCE_ACTIVITY}
        columns={[
          { key: "time", header: "Time" },
          { key: "agent", header: "Agent" },
          { key: "action", header: "Action" },
        ]}
      />
    </Panel>
  );
}
