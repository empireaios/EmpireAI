"use client";

import { DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  INFRASTRUCTURE_ALERTS,
  INFRASTRUCTURE_DEPLOYMENTS,
  INFRASTRUCTURE_INTEGRATIONS,
  INFRASTRUCTURE_SERVICES,
} from "@/components/cockpit/widgets/infrastructure/infrastructureDemoData";

/** SCR-601 — Infrastructure Services / Deployments (REAL-115). */
export function InfrastructureServicesPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Deployment Status" subtitle="Production and preview targets">
        <DataTable
          keyField="id"
          data={INFRASTRUCTURE_DEPLOYMENTS}
          columns={[
            { key: "project", header: "Project" },
            { key: "environment", header: "Environment" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "version", header: "Version" },
          ]}
        />
      </Panel>
      <Panel title="Core Services">
        <DataTable
          keyField="id"
          data={INFRASTRUCTURE_SERVICES}
          columns={[
            { key: "name", header: "Service" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "uptime", header: "Uptime" },
            { key: "region", header: "Region" },
          ]}
        />
      </Panel>
    </div>
  );
}

/** SCR-600 — Infrastructure Integrations (REAL-116). */
export function InfrastructureIntegrationsPanel() {
  return (
    <Panel title="Integration Connections" subtitle="Connector grid — demo stubs">
      <DataTable
        keyField="id"
        data={INFRASTRUCTURE_INTEGRATIONS}
        columns={[
          { key: "name", header: "Integration" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "lastSync", header: "Last sync" },
        ]}
      />
    </Panel>
  );
}

/** SCR-602 — Infrastructure Monitoring / Health (REAL-117). */
export function InfrastructureMonitoringPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Services online" value="2/3" change="Brain degraded" trend="down" />
        <StatCard label="Integrations" value="1/4" change="Live connected" trend="neutral" />
        <StatCard label="Open alerts" value={String(INFRASTRUCTURE_ALERTS.length)} change="Monitoring demo" trend="neutral" />
      </div>
      <Panel title="Health Alerts">
        <ul className="space-y-3">
          {INFRASTRUCTURE_ALERTS.map((a) => (
            <li key={a.id} className="rounded-lg border border-gold/10 px-4 py-3 text-sm">
              <StatusBadge status={a.severity} /> · {a.service} — {a.message}
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

/** SCR-603 — Infrastructure Admin console. */
export function InfrastructureAdminPanel() {
  return (
    <Panel title="Admin Console" subtitle="Synthetic metrics — REAL-131 live path">
      <div className="flex h-32 items-center justify-center rounded-lg border border-dashed border-gold/20 text-sm text-[#6f6a60]">
        Admin metrics backend not wired in demo mode
      </div>
    </Panel>
  );
}
