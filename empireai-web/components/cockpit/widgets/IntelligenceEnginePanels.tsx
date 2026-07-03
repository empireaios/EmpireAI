"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { EngineCenterLayout, EnginePanelFrame } from "@/components/cockpit/widgets/EnginePanelFrame";
import type { EnginePanelView } from "@/lib/cockpit/panel-types";

type IntelligenceView = {
  metrics: Array<{ label: string; value: string }>;
  products: Array<{
    id: string;
    name: string;
    score: number;
    demand: string;
    margin: string;
    recommendation: string;
  }>;
};

/** SCR-100 — Product Intelligence Center (live). */
export function IntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("cockpit-intelligence");
  const catalog = useBrainModule<IntelligenceView>("intelligence");

  if (engine.loading || catalog.loading) {
    return <Panel title="Product Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Product Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
      {catalog.data && (
        <Panel title="Product Catalog" subtitle="Live · intelligence.load_view">
          <div className="mb-4 grid gap-4 sm:grid-cols-3">
            {catalog.data.metrics.map((m) => (
              <StatCard key={m.label} label={m.label} value={m.value} />
            ))}
          </div>
          <ActionButton disabled>Scan requires King approval in production mode</ActionButton>
          <DataTable
            keyField="id"
            data={catalog.data.products}
            columns={[
              { key: "name", header: "Product" },
              { key: "score", header: "Score" },
              { key: "demand", header: "Demand" },
              { key: "margin", header: "Margin" },
              {
                key: "recommendation",
                header: "Signal",
                render: (r) => <StatusBadge status={r.recommendation.toLowerCase()} />,
              },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}

/** SCR-101 — Supplier Intelligence Engine (G3-03). */
export function IntelligenceSuppliersPanel() {
  const engine = useBrainModule<EnginePanelView>("supplier-intelligence-engine");
  const { data: suppliers, loading, error, reload } = useBrainModule<{
    metrics: Array<{ label: string; value: string }>;
    suppliers: Array<{
      id: string;
      name: string;
      region: string;
      reliability: number;
      avgShip: string;
      status: string;
    }>;
  }>("suppliers");

  return (
    <div className="space-y-6">
      {engine.loading && <Panel title="Supplier Intelligence">Loading engine panel…</Panel>}
      {engine.error && (
        <Panel title="Supplier Intelligence">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
            Retry supplier intelligence engine
          </button>
        </Panel>
      )}
      {engine.data && <EnginePanelFrame panel={engine.data} />}
      {loading && <Panel title="Supplier Network">Loading supplier data…</Panel>}
      {error && (
        <Panel title="Supplier Network">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
            Retry supplier catalog
          </button>
        </Panel>
      )}
      {suppliers && (
        <Panel title="Supplier Network" subtitle="Live · suppliers.load_view">
          <DataTable
            keyField="id"
            data={suppliers.suppliers}
            columns={[
              { key: "name", header: "Supplier" },
              { key: "region", header: "Region" },
              { key: "reliability", header: "Reliability", render: (r) => `${r.reliability}%` },
              { key: "avgShip", header: "Lead time" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}

/** SCR-102 — Quantitative Intelligence Engine (G3-05). */
export function IntelligenceDiscoveryPanel() {
  const engine = useBrainModule<EnginePanelView>("quantitative-intelligence-engine");
  const { data, loading, error, reload } = useBrainModule<IntelligenceView>("intelligence");

  return (
    <div className="space-y-6">
      {engine.loading && <Panel title="Quantitative Intelligence">Loading engine panel…</Panel>}
      {engine.error && (
        <Panel title="Quantitative Intelligence">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
            Retry quantitative intelligence engine
          </button>
        </Panel>
      )}
      {engine.data && <EnginePanelFrame panel={engine.data} />}
      {loading && <Panel title="Discovery Scores">Loading intelligence catalog…</Panel>}
      {error && (
        <Panel title="Discovery Scores">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
            Retry intelligence module
          </button>
        </Panel>
      )}
      {data && data.products.length > 0 && (
        <Panel title="PIE Score Inputs" subtitle="Live · intelligence.load_view (mathematical inputs only)">
          <DataTable
            keyField="id"
            data={data.products.filter((p) => p.score >= 70)}
            columns={[
              { key: "name", header: "Opportunity" },
              { key: "score", header: "Score" },
              { key: "demand", header: "Demand" },
              { key: "recommendation", header: "PIE signal" },
            ]}
          />
        </Panel>
      )}
    </div>
  );
}

/** SCR-103 — Marketplace Engine (live). */
export function IntelligenceMarketplacePanel() {
  return (
    <div className="space-y-6">
      <EngineCenterLayout engineId="marketplace" />
    </div>
  );
}

/** SCR-107 — Customer Intelligence Engine (G3-07). */
export function CustomerIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("customer-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Customer Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Customer Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
    </div>
  );
}

/** SCR-110 — Executive Intelligence Orchestrator (G3-10). */
export function ExecutiveIntelligenceOrchestratorPanel() {
  const engine = useBrainModule<EnginePanelView>("executive-intelligence-orchestrator");

  if (engine.loading) {
    return <Panel title="Executive Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Executive Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
    </div>
  );
}

/** SCR-109 — Decision Intelligence Engine (G3-09). */
export function DecisionIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("decision-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Decision Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Decision Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
    </div>
  );
}

/** SCR-108 — Risk Intelligence Engine (G3-08). */
export function RiskIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("risk-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Risk Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Risk Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
    </div>
  );
}

/** SCR-104 — Market Intelligence Engine (G3-02). */
export function MarketIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("market-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Market Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Market Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void engine.reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <EnginePanelFrame panel={engine.data} />
    </div>
  );
}
