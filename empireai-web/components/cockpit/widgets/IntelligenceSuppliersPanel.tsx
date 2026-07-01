"use client";

import { ActionButton, DataTable, Panel } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { INTELLIGENCE_SUPPLIERS } from "@/components/cockpit/widgets/intelligence/intelligenceDemoData";

/** SCR-101 — Intelligence Supplier Intelligence (REAL-100). */
export function IntelligenceSuppliersPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Evaluate supplier</ActionButton>
      <Panel title="Supplier Intelligence" subtitle="SIE evaluate UI — demo presentation">
        <DataTable
          keyField="id"
          data={INTELLIGENCE_SUPPLIERS}
          columns={[
            { key: "name", header: "Supplier" },
            { key: "rating", header: "Rating" },
            { key: "leadTime", header: "Lead time" },
            { key: "products", header: "Products" },
            {
              key: "status",
              header: "Status",
              render: (r) => <StatusBadge status={r.status} />,
            },
          ]}
        />
      </Panel>
    </div>
  );
}
