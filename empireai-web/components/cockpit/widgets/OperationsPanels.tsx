"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  OPERATIONS_FULFILLMENT_STEPS,
  OPERATIONS_ORDER_METRICS,
  OPERATIONS_ORDERS,
} from "@/components/cockpit/widgets/operations/operationsDemoData";

/** SCR-300 — Operations Order Queue (REAL-103). */
export function OperationsOrdersPanel() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {OPERATIONS_ORDER_METRICS.map((m) => (
          <StatCard key={m.label} {...m} />
        ))}
      </div>
      <ActionButton disabled>Submit sandbox order</ActionButton>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Order Queue" subtitle="Sandbox demo — no live fulfillment" className="xl:col-span-2">
          <DataTable
            keyField="id"
            data={OPERATIONS_ORDERS}
            columns={[
              { key: "id", header: "Order" },
              { key: "company", header: "Company" },
              { key: "product", header: "Product" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              { key: "total", header: "Total" },
            ]}
          />
        </Panel>
        <Panel title="Fulfillment Readiness" subtitle="Prepare → Approve → Submit">
          <div className="space-y-4">
            {OPERATIONS_FULFILLMENT_STEPS.map((step) => (
              <div key={step.step}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-[#c8c0b0]">{step.step}</span>
                  <StatusBadge status={step.status} />
                </div>
                <div className="h-1.5 rounded-full bg-white/[0.05]">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]" style={{ width: `${step.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

/** SCR-301 — Operations Fulfilment (REAL-104). */
export function OperationsFulfillmentPanel() {
  return (
    <div className="space-y-6">
      <Panel title="Fulfillment Pipeline" subtitle="CJ integration disabled in demo">
        <div className="space-y-4">
          {OPERATIONS_FULFILLMENT_STEPS.map((step) => (
            <div key={step.step} className="rounded-lg border border-gold/10 p-4">
              <div className="flex justify-between">
                <span className="text-sm text-[#f0d78c]">{step.step}</span>
                <StatusBadge status={step.status} />
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/[0.05]">
                <div className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]" style={{ width: `${step.progress}%` }} />
              </div>
            </div>
          ))}
        </div>
      </Panel>
      <ActionButton disabled>Approve fulfillment submit</ActionButton>
    </div>
  );
}

/** SCR-302 — Operations Customer Support (REAL-105). */
export function OperationsSupportPanel() {
  return (
    <div className="space-y-6">
      <ActionButton disabled>Resolve ticket</ActionButton>
      <Panel title="Support Queue" subtitle="Customer support — demo presentation">
        <DataTable
          keyField="id"
          data={[
            { id: "TK-88", customer: "Alex M.", subject: "Delivery ETA for lamp order", priority: "medium", status: "open" },
            { id: "TK-87", customer: "Jordan K.", subject: "Return policy question", priority: "low", status: "pending" },
            { id: "TK-86", customer: "Sam R.", subject: "Product compatibility", priority: "high", status: "resolved" },
          ]}
          columns={[
            { key: "id", header: "Ticket" },
            { key: "customer", header: "Customer" },
            { key: "subject", header: "Subject" },
            { key: "priority", header: "Priority" },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          ]}
        />
      </Panel>
    </div>
  );
}
