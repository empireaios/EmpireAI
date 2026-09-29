"use client";

import {
  CockpitDataTable,
  CockpitPanel,
} from "@/components/cockpit/ui";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import Link from 'next/link';
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
  return <CockpitPanel title="Service status unavailable" subtitle="No current service observation">
    <p className="mb-4">Example deployments and uptime figures have been removed. This page cannot verify current service health.</p>
    <Link className="text-amber-200 underline" href="/cockpit#health">Open owner health summary</Link>
  </CockpitPanel>;
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
  return <CockpitPanel title="Live monitoring not connected" subtitle="Health is unknown, not healthy">
    <p className="mb-4">Static service counts and sample alerts have been removed. Use the dated owner summary to inspect the evidence we actually have.</p>
    <Link className="text-amber-200 underline" href="/cockpit#health">Open owner health summary</Link>
  </CockpitPanel>;
}

/** SCR-603 — Infrastructure Admin console (REAL-131). */
export function InfrastructureAdminPanel() {
  return <AdminModule />;
}
