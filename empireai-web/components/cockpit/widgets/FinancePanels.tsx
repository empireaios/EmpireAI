"use client";

import { DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { EngineCenterPanel, EnginePanelFrame } from "@/components/cockpit/widgets/EnginePanelFrame";
import type { EnginePanelView } from "@/lib/cockpit/panel-types";
import type { Metric } from "@/lib/platform/types";
import type { ExecutiveAuditView } from "@/lib/cockpit/panel-types";

type FinanceView = {
  metrics: Metric[];
  breakdown: {
    revenue: string;
    cogs: string;
    adSpend: string;
    platformFees: string;
    netProfit: string;
    margin: string;
  };
  orderProfitToday: string;
};

/** SCR-400 — Analytics + Revenue (live). */
export function FinanceDashboardPanel() {
  const { data, loading, error, reload } = useBrainModule<FinanceView>("finance");

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="analytics" />
      {loading && <Panel title="Profit Dashboard">Loading…</Panel>}
      {error && (
        <Panel title="Profit Dashboard">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
            Retry
          </button>
        </Panel>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {data.metrics.map((m) => (
              <StatCard key={m.label} {...m} />
            ))}
          </div>
          <Panel title="P&L Breakdown" subtitle="Live · finance.load_view">
            <ul className="space-y-3">
              {Object.entries(data.breakdown).map(([key, value]) => (
                <li key={key} className="flex justify-between rounded-lg border border-gold/10 px-4 py-3 text-sm">
                  <span className="capitalize text-[#c8c0b0]">{key.replace(/([A-Z])/g, " $1")}</span>
                  <span className="font-medium text-[#f0d78c]">{value}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </>
      )}
    </div>
  );
}

/** SCR-401 — P&L (live finance view). */
export function FinanceRevenuePanel() {
  const { data, loading, error, reload } = useBrainModule<FinanceView>("finance");

  if (loading) {
    return <Panel title="P&L">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="P&L">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <Panel title="P&L Waterfall" subtitle="Live · finance.load_view">
      <ul className="space-y-3">
        {Object.entries(data.breakdown).map(([label, value]) => (
          <li key={label} className="flex justify-between rounded-lg border border-gold/10 px-4 py-3 text-sm">
            <span className="text-[#c8c0b0]">{label}</span>
            <span className="font-medium text-[#f0d78c]">{value}</span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

/** SCR-402 — Payment Engine (live). */
export function FinanceTreasuryPanel() {
  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="payment" />
    </div>
  );
}

/** SCR-403 — Costs (live partial). */
export function FinanceExpensesPanel() {
  const { data, loading, error, reload } = useBrainModule<FinanceView>("finance");

  if (loading) {
    return <Panel title="Cost Intelligence">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="Cost Intelligence">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const rows = [
    { id: "cogs", category: "COGS", amount: data.breakdown.cogs, trend: "neutral" },
    { id: "ads", category: "Ad Spend", amount: data.breakdown.adSpend, trend: "up" },
    { id: "fees", category: "Platform Fees", amount: data.breakdown.platformFees, trend: "neutral" },
  ];

  return (
    <Panel title="Operating Costs" subtitle="Live · derived from finance.load_view">
      <DataTable
        keyField="id"
        data={rows}
        columns={[
          { key: "category", header: "Category" },
          { key: "amount", header: "Amount" },
          { key: "trend", header: "Trend" },
        ]}
      />
    </Panel>
  );
}

/** SCR-105 — Financial Intelligence Engine (G3-04). */
export function FinancialIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("financial-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Financial Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Financial Intelligence">
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

/** SCR-704 — V1 Certification (live audit center). */
export function GovernanceV1CertificationPanel() {
  const { data, loading, error, reload } = useBrainModule<ExecutiveAuditView>("cockpit-audit");

  if (loading) {
    return <Panel title="V1 Certification">Loading…</Panel>;
  }
  if (error || !data) {
    return (
      <Panel title="V1 Certification">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const blockers = Object.values(data.certificationBlockers);

  return (
    <div className="space-y-6">
      <Panel title="V1 Certification Readiness" subtitle="Live · B5–B8 + activation gates">
        <p className="mb-4 text-sm text-[#c8c0b0]">
          B6 progress: {data.b6.progressPercent}% · Current: {data.b6.currentObjectiveId}
        </p>
        <DataTable
          keyField="id"
          data={blockers}
          columns={[
            { key: "id", header: "Gate" },
            { key: "label", header: "Label" },
            { key: "status", header: "Status" },
            { key: "detail", header: "Detail" },
          ]}
        />
      </Panel>
      <Panel title="Operational Activation" subtitle={data.activation.ready ? "Ready" : "Blocked"}>
        {data.activation.ready ? (
          <p className="text-sm text-emerald-300/90">Version 1 operational activation gates pass.</p>
        ) : (
          <ul className="list-inside list-disc text-sm text-[#8a847a]">
            {data.activation.blockers.map((b) => (
              <li key={b}>{b}</li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
