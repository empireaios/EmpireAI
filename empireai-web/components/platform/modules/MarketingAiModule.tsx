"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Metric } from "@/lib/platform/types";

type MarketingView = {
  metrics?: Metric[];
  campaigns: Array<{
    id: string;
    name: string;
    channel: string;
    status: string;
    reach: string;
    conversion: string;
  }>;
};

export function MarketingAiModule() {
  const { data, loading, error, reload } = useBrainModule<MarketingView>("marketing");

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Growth Engine"
            title="Marketing AI"
            description="Autonomous content, positioning, and channel strategy across every manufactured company in your portfolio."
            actions={<ActionButton>Generate campaign</ActionButton>}
          />

          {data.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Active Campaigns">
              <DataTable
                keyField="id"
                data={data.campaigns}
                columns={[
                  { key: "name", header: "Campaign" },
                  { key: "channel", header: "Channel" },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => <Badge variant="success">{String(row.status)}</Badge>,
                  },
                  { key: "reach", header: "Reach" },
                  { key: "conversion", header: "Conv." },
                ]}
              />
            </Panel>

            <Panel title="AI Content Pipeline" subtitle="Riley · Copywriter Agent">
              <ul className="space-y-3 text-sm text-[#c8c0b0]">
                <li className="rounded-lg border border-gold/10 px-4 py-3">
                  Generated 12 email sequences for Vertex SaaS retention
                </li>
                <li className="rounded-lg border border-gold/10 px-4 py-3">
                  Repositioned Meridian hero copy — +18% CTR projected
                </li>
                <li className="rounded-lg border border-gold/10 px-4 py-3">
                  Localized Atlas Fintech landing for EU markets
                </li>
              </ul>
            </Panel>
          </div>
        </>
      )}
    </BrainModuleShell>
  );
}
