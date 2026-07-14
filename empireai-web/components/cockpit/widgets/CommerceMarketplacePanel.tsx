"use client";

import { useCallback, useEffect, useState } from "react";

import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { EngineCenterPanel } from "@/components/cockpit/widgets/EnginePanelFrame";

type ConnectorRow = {
  connectorId: string;
  displayName: string;
  status: string;
  connectionStatus: string;
  syncStatus: string;
  healthStatus: string;
  pipelinePhase: string;
  performanceScore: number;
  recoveryStatus: string;
};

type MarketplaceIntegrationView = {
  view: {
    screenId: string;
    architecture: {
      executiveSummary: string;
      connectorCount: number;
      connectedCount: number;
      degradedCount: number;
      failureCount: number;
      pipeline: string[];
      syncDomains: string[];
      connectors: ConnectorRow[];
      pillowRecommendations: string[];
      eccCoordinationNotes: string[];
      supervisorNotes: string[];
      guardianNotes: string[];
    };
  };
};

/** SCR-205 — Marketplace Integration panel (P8-03). */
export function CommerceMarketplacePanel() {
  const [data, setData] = useState<MarketplaceIntegrationView | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/commerce/marketplace-integration", { credentials: "include" });
      if (!res.ok) throw new Error(`Marketplace integration unavailable (${res.status})`);
      const json = (await res.json()) as MarketplaceIntegrationView;
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load marketplace integration");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return <Panel title="Marketplace Integration">Loading unified marketplace architecture…</Panel>;
  }

  if (error || !data?.view) {
    return (
      <Panel title="Marketplace Integration" subtitle="P8-03 · Unified integration layer">
        <p className="text-sm text-[#8a847a]">{error ?? "No data"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void load()}>
          Retry
        </button>
      </Panel>
    );
  }

  const arch = data.view.architecture;

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="marketplace" />
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">P8-03 Unified Architecture</Badge>
        <Badge variant="success">{arch.connectedCount} connected</Badge>
        {arch.degradedCount > 0 && <Badge variant="warning">{arch.degradedCount} degraded</Badge>}
        <Badge variant="default">{arch.connectorCount} connectors</Badge>
      </div>

      <p className="text-sm text-[#c4bfb3]">{arch.executiveSummary}</p>

      <div className="grid gap-4 sm:grid-cols-4">
        <StatCard label="Connectors" value={String(arch.connectorCount)} />
        <StatCard label="Connected" value={String(arch.connectedCount)} trend="up" />
        <StatCard label="Sync Domains" value={String(arch.syncDomains.length)} />
        <StatCard label="Failures" value={String(arch.failureCount)} trend={arch.failureCount > 0 ? "down" : undefined} />
      </div>

      <Panel title="Connected Marketplaces" subtitle="Replaceable connectors · registry-backed">
        <DataTable
          keyField="connectorId"
          data={arch.connectors}
          columns={[
            { key: "displayName", header: "Marketplace" },
            {
              key: "connectionStatus",
              header: "Connection",
              render: (r) => <StatusBadge status={r.connectionStatus} />,
            },
            {
              key: "syncStatus",
              header: "Sync",
              render: (r) => <StatusBadge status={r.syncStatus} />,
            },
            {
              key: "healthStatus",
              header: "Health",
              render: (r) => <StatusBadge status={r.healthStatus} />,
            },
            {
              key: "pipelinePhase",
              header: "Pipeline",
              render: (r) => r.pipelinePhase.replace(/_/g, " "),
            },
            {
              key: "recoveryStatus",
              header: "Recovery",
              render: (r) => <StatusBadge status={r.recoveryStatus} />,
            },
            { key: "performanceScore", header: "Score" },
          ]}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Pillow Recommendations" subtitle="Integration quality · commercial opportunities">
          <ul className="space-y-2 text-sm text-[#c4bfb3]">
            {arch.pillowRecommendations.map((item) => (
              <li key={item}>• {item}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Supervisor · Guardian · ECC" subtitle="Continuous monitoring">
          <ul className="space-y-1 text-sm text-[#8a847a]">
            {arch.supervisorNotes.map((n) => (
              <li key={n}>Supervisor: {n}</li>
            ))}
            {arch.guardianNotes.map((n) => (
              <li key={n}>Guardian: {n}</li>
            ))}
            {arch.eccCoordinationNotes.map((n) => (
              <li key={n}>ECC: {n}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Integration Pipeline" subtitle={`${arch.pipeline.length} phases · provider-independent`}>
        <div className="flex flex-wrap gap-2">
          {arch.pipeline.map((phase, i) => (
            <Badge key={phase} variant={i === arch.pipeline.length - 1 ? "gold" : "default"}>
              {phase.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>
    </div>
  );
}
