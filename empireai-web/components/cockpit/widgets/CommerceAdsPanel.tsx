"use client";

import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  COMMERCE_ADS_CAMPAIGNS,
  COMMERCE_ADS_CHANNELS,
  COMMERCE_ADS_METRICS,
} from "@/components/cockpit/widgets/commerce/commerceAdsDemoData";

/** SCR-203 — Commerce Ads panel (presentation-only demo). */
export function CommerceAdsPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {COMMERCE_ADS_METRICS.map((metric) => (
          <StatCard key={metric.label} {...metric} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton variant="secondary" disabled>
          Pause all
        </ActionButton>
        <ActionButton disabled>Adjust budget</ActionButton>
      </div>

      <Panel title="Channel Performance" subtitle="Taylor · Media Buyer Agent · demo mode">
        <div className="grid gap-4 sm:grid-cols-3">
          {COMMERCE_ADS_CHANNELS.map((channel) => (
            <div
              key={channel.channel}
              className="rounded-lg border border-gold/10 bg-white/[0.02] p-5"
            >
              <div className="flex items-center justify-between">
                <p className="font-medium text-[#f0d78c]">{channel.channel}</p>
                <Badge variant={channel.status === "Live" ? "success" : "warning"}>
                  {channel.status}
                </Badge>
              </div>
              <p className="mt-4 font-display text-2xl text-[#d4af37]">{channel.roas}</p>
              <p className="text-xs text-[#6f6a60]">ROAS</p>
              <p className="mt-2 text-sm text-[#8a847a]">{channel.spend} spent</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Campaign Table" subtitle="Paid acquisition orchestration">
        <DataTable
          keyField="id"
          data={COMMERCE_ADS_CAMPAIGNS}
          columns={[
            { key: "name", header: "Campaign" },
            { key: "platform", header: "Platform" },
            { key: "budget", header: "Budget" },
            { key: "roas", header: "ROAS" },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
          ]}
        />
      </Panel>
    </div>
  );
}
