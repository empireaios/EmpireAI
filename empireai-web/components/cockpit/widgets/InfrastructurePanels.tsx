"use client";

import {
  CockpitDataTable,
  CockpitPanel,
  CockpitStatCard,
} from "@/components/cockpit/ui";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  INFRASTRUCTURE_ALERTS,
  INFRASTRUCTURE_DEPLOYMENTS,
  INFRASTRUCTURE_SERVICES,
} from "@/components/cockpit/widgets/infrastructure/infrastructureDemoData";
import { AdminModule } from "@/components/platform/modules/AdminModule";

type IntegrationsView = {
  mode: string;
  liveCommerceEnabled: boolean;
  integrations: Array<{
    id: string;
    name: string;
    type: string;
    status: string;
    lastSync: string;
  }>;
};

/** SCR-601 — Infrastructure Services / Deployments (REAL-115). */
export function InfrastructureServicesPanel() {
  return (
    <div className="space-y-6">
      <CockpitPanel title="Deployment Status" subtitle="Production and preview targets">
        <CockpitDataTable
          keyField="id"
          data={INFRASTRUCTURE_DEPLOYMENTS}
          columns={[
            { key: "project", header: "Project" },
            { key: "environment", header: "Environment" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "version", header: "Version" },
          ]}
        />
      </CockpitPanel>
      <CockpitPanel title="Core Services">
        <CockpitDataTable
          keyField="id"
          data={INFRASTRUCTURE_SERVICES}
          columns={[
            { key: "name", header: "Service" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "uptime", header: "Uptime" },
            { key: "region", header: "Region" },
          ]}
        />
      </CockpitPanel>
    </div>
  );
}

/** SCR-600 — Infrastructure Integrations (REAL-133 live connector truth). */
export function InfrastructureIntegrationsPanel() {
  const { data, loading, error, reload } = useBrainModule<IntegrationsView>("integrations");

  if (loading) {
    return <CockpitPanel title="Integration Connections">Loading connector grid…</CockpitPanel>;
  }

  if (error || !data) {
    return (
      <CockpitPanel title="Integration Connections" subtitle="Connector grid unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </CockpitPanel>
    );
  }

  return (
    <CockpitPanel
      title="Integration Connections"
      subtitle={`Live commerce mode: ${data.mode}${data.liveCommerceEnabled ? " · production" : ""}`}
    >
      <CockpitDataTable
        keyField="id"
        data={data.integrations}
        columns={[
          { key: "name", header: "Integration" },
          { key: "type", header: "Type" },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "lastSync", header: "Last sync" },
        ]}
      />
    </CockpitPanel>
  );
}

/** SCR-602 — Infrastructure Monitoring / Health (REAL-117). */
export function InfrastructureMonitoringPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <CockpitStatCard label="Services online" value="2/3" change="Brain degraded" trend="down" />
        <CockpitStatCard label="Integrations" value="1/4" change="Live connected" trend="neutral" />
        <CockpitStatCard label="Open alerts" value={String(INFRASTRUCTURE_ALERTS.length)} change="Monitoring demo" trend="neutral" />
      </div>
      <CockpitPanel title="Health Alerts">
        <ul className="space-y-3">
          {INFRASTRUCTURE_ALERTS.map((a) => (
            <li key={a.id} className="rounded-lg border border-gold/10 px-4 py-3 text-sm">
              <StatusBadge status={a.severity} /> · {a.service} — {a.message}
            </li>
          ))}
        </ul>
      </CockpitPanel>
    </div>
  );
}

/** SCR-603 — Infrastructure Admin console (REAL-131). */
export function InfrastructureAdminPanel() {
  return <AdminModule />;
}
