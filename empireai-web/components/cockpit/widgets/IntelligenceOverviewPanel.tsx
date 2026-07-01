"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  INTELLIGENCE_OVERVIEW_METRICS,
  INTELLIGENCE_PRODUCTS,
} from "@/components/cockpit/widgets/intelligence/intelligenceDemoData";

/** SCR-100 — Intelligence Overview / Products (REAL-097). */
export function IntelligenceOverviewPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {INTELLIGENCE_OVERVIEW_METRICS.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>
      <ActionButton disabled>Scan category</ActionButton>
      <Panel title="Product Intelligence" subtitle="Sam · Intelligence Agent · demo mode">
        <DataTable
          keyField="id"
          data={INTELLIGENCE_PRODUCTS}
          columns={[
            { key: "name", header: "Product" },
            { key: "score", header: "Score", render: (r) => `${r.score}` },
            { key: "demand", header: "Demand" },
            { key: "margin", header: "Margin" },
            { key: "trend", header: "Trend" },
            {
              key: "recommendation",
              header: "Signal",
              render: (r) => <StatusBadge status={r.recommendation} />,
            },
          ]}
        />
      </Panel>
    </div>
  );
}
