"use client";

import { DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { EngineCenterPanel, EnginePanelFrame } from "@/components/cockpit/widgets/EnginePanelFrame";
import type { EnginePanelView } from "@/lib/cockpit/panel-types";
import type { Metric } from "@/lib/platform/types";

type MarketingView = {
  metrics: Metric[];
  campaigns: Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    reach: string;
    conversion: string;
  }>;
};

type AdsView = {
  metrics: Metric[];
  channels: Array<{ channel: string; spend: string; roas: string; status: string }>;
};

/** SCR-202 — Marketing (live domain + advertising engine frame). */
export function CommerceMarketingPanel() {
  const { data, loading, error, reload } = useBrainModule<MarketingView>("marketing");

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="advertising" />
      {loading && <Panel title="Marketing Campaigns">Loading…</Panel>}
      {error && (
        <Panel title="Marketing Campaigns">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
            Retry
          </button>
        </Panel>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-3">
            {data.metrics.map((m) => (
              <StatCard key={m.label} {...m} />
            ))}
          </div>
          <Panel title="Active Campaigns" subtitle="Live · marketing.load_view">
            <DataTable
              keyField="id"
              data={data.campaigns}
              columns={[
                { key: "name", header: "Campaign" },
                { key: "channel", header: "Channel" },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
                { key: "reach", header: "Reach" },
                { key: "conversion", header: "Conv." },
              ]}
            />
          </Panel>
        </>
      )}
    </div>
  );
}

/** SCR-106 — Advertising Intelligence Engine (G3-06). */
export function AdvertisingIntelligenceOverviewPanel() {
  const engine = useBrainModule<EnginePanelView>("advertising-intelligence-engine");

  if (engine.loading) {
    return <Panel title="Advertising Intelligence">Loading…</Panel>;
  }

  if (engine.error || !engine.data) {
    return (
      <Panel title="Advertising Intelligence">
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

/** SCR-203 — Ads (live domain). */
export function CommerceAdsPanel() {
  const { data, loading, error, reload } = useBrainModule<AdsView>("ads");

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="advertising" />
      {loading && <Panel title="Ad Channels">Loading…</Panel>}
      {error && (
        <Panel title="Ad Channels">
          <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
            Retry
          </button>
        </Panel>
      )}
      {data && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.metrics.map((m) => (
              <StatCard key={m.label} {...m} />
            ))}
          </div>
          <Panel title="Ad Channels" subtitle="Live · ads.load_view">
            <DataTable
              keyField="channel"
              data={data.channels}
              columns={[
                { key: "channel", header: "Channel" },
                { key: "spend", header: "Spend" },
                { key: "roas", header: "ROAS" },
                {
                  key: "status",
                  header: "Status",
                  render: (r) => <StatusBadge status={r.status} />,
                },
              ]}
            />
          </Panel>
        </>
      )}
    </div>
  );
}
