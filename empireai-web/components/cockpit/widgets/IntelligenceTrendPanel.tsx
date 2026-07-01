"use client";

import { DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { INTELLIGENCE_TRENDS } from "@/components/cockpit/widgets/intelligence/intelligenceDemoData";

/** SCR-103 — Intelligence Trend / Marketplace (REAL-099). */
export function IntelligenceTrendPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Active trends" value="12" change="Demo signals" trend="neutral" />
        <StatCard label="Strong signals" value="5" change="Actionable" trend="up" />
        <StatCard label="Weak signals" value="3" change="Avoid category" trend="down" />
      </div>
      <Panel title="Trend Intelligence" subtitle="Market velocity and category signals">
        <DataTable
          keyField="id"
          data={INTELLIGENCE_TRENDS}
          columns={[
            { key: "trend", header: "Trend" },
            { key: "category", header: "Category" },
            { key: "velocity", header: "Velocity" },
            {
              key: "signal",
              header: "Signal",
              render: (r) => <StatusBadge status={r.signal} />,
            },
          ]}
        />
      </Panel>
    </div>
  );
}
