"use client";

import {
  ActionButton,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  COMMERCE_MARKETING_CAMPAIGNS,
  COMMERCE_MARKETING_METRICS,
  COMMERCE_MARKETING_PIPELINE,
} from "@/components/cockpit/widgets/commerce/commerceMarketingDemoData";

/** SCR-202 — Commerce Marketing panel (presentation-only demo). */
export function CommerceMarketingPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {COMMERCE_MARKETING_METRICS.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton disabled>Generate campaign</ActionButton>
        <ActionButton variant="secondary" disabled>
          Schedule content
        </ActionButton>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Active Campaigns" subtitle="Riley · Copywriter Agent · demo mode">
          <DataTable
            keyField="id"
            data={COMMERCE_MARKETING_CAMPAIGNS}
            columns={[
              { key: "name", header: "Campaign" },
              { key: "channel", header: "Channel" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
              { key: "reach", header: "Reach" },
              { key: "conversion", header: "Conv." },
            ]}
          />
        </Panel>

        <Panel title="AI Content Pipeline" subtitle="Autonomous content generation queue">
          <ul className="space-y-3 text-sm text-[#c8c0b0]">
            {COMMERCE_MARKETING_PIPELINE.map((item) => (
              <li key={item} className="rounded-lg border border-gold/10 px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
