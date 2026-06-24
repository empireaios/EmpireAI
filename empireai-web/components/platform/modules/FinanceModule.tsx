"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Metric } from "@/lib/platform/types";

type FinanceView = {
  metrics?: Metric[];
  breakdown: {
    revenue: string;
    cogs: string;
    adSpend: string;
    platformFees: string;
    netProfit: string;
    margin: string;
  };
};

export function FinanceModule() {
  const { data, loading, error, reload } = useBrainModule<FinanceView>("finance");
  const breakdown = data?.breakdown;

  const rows = breakdown
    ? [
        { label: "Gross Revenue", value: breakdown.revenue, type: "positive" },
        { label: "Product Costs (COGS)", value: breakdown.cogs, type: "negative" },
        { label: "Ad Spend", value: breakdown.adSpend, type: "negative" },
        { label: "Platform Fees", value: breakdown.platformFees, type: "negative" },
        { label: "Net Profit", value: breakdown.netProfit, type: "total" },
      ]
    : [];

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!breakdown ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Capital Intelligence"
            title="Finance Dashboard"
            description="Portfolio-wide P&L, cash flow, and capital efficiency across every manufactured company."
            actions={<ActionButton>Download P&L</ActionButton>}
          />

          {data?.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-3">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <Panel title="Portfolio Waterfall" subtitle="Month to date">
            <div className="space-y-3">
              {rows.map((row) => (
                <div
                  key={row.label}
                  className={`flex items-center justify-between rounded-lg px-4 py-3 ${
                    row.type === "total"
                      ? "border border-gold/25 bg-gold/5"
                      : "border border-gold/10 bg-white/[0.02]"
                  }`}
                >
                  <span
                    className={`text-sm ${
                      row.type === "total" ? "font-semibold text-[#f0d78c]" : "text-[#c8c0b0]"
                    }`}
                  >
                    {row.label}
                  </span>
                  <span
                    className={`font-display text-lg ${
                      row.type === "negative"
                        ? "text-red-400/80"
                        : row.type === "total"
                          ? "text-[#d4af37]"
                          : "text-emerald-400"
                    }`}
                  >
                    {row.type === "negative" ? "−" : ""}
                    {row.value}
                  </span>
                </div>
              ))}
            </div>
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
