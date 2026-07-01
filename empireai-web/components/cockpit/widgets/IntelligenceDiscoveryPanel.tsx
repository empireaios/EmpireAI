"use client";

import { ActionButton, DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { INTELLIGENCE_DISCOVERY_SESSIONS } from "@/components/cockpit/widgets/intelligence/intelligenceDemoData";

/** SCR-102 — Intelligence Product Discovery (REAL-098). */
export function IntelligenceDiscoveryPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Start discovery session</ActionButton>
      <Panel title="Discovery Sessions" subtitle="Keyword-driven product scan pipeline">
        <DataTable
          keyField="id"
          data={INTELLIGENCE_DISCOVERY_SESSIONS}
          columns={[
            { key: "keyword", header: "Keyword" },
            { key: "products", header: "Products found" },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
            {
              key: "confidence",
              header: "Confidence",
              render: (r) => (r.confidence ? `${r.confidence}%` : "—"),
            },
          ]}
        />
      </Panel>
    </div>
  );
}
