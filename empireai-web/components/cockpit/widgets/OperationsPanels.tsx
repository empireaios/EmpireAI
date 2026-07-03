"use client";

import { ActionButton, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { EngineCenterPanel } from "@/components/cockpit/widgets/EnginePanelFrame";
import type { Metric } from "@/lib/platform/types";

type OrdersView = {
  metrics: Metric[];
  orders: Array<{
    id: string;
    company: string;
    product: string;
    total: string;
    profit: string;
    status: string;
    date: string;
  }>;
};

import type { FulfillmentReadinessSummary } from "@/lib/brain/fulfillment/types";

type SupportView = {
  metrics: Metric[];
  tickets: Array<{
    id: string;
    subject: string;
    customer: string;
    status: string;
    agent: string;
    resolution: string;
  }>;
};

/** SCR-300 — Operations Order Queue (Brain live — P0-5). */
export function OperationsOrdersPanel() {
  const { data, loading, error, reload } = useBrainModule<OrdersView>("orders");
  const fulfillment = useBrainModule<FulfillmentReadinessSummary>(
    "orders",
    "get_fulfillment_readiness",
  );

  if (loading) {
    return <Panel title="Order Queue">Loading live orders…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Order Queue" subtitle="Brain dispatch unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const fulfillmentSteps = [
    {
      step: "Supplier validation",
      status: fulfillment.data?.supplierValidation.valid ? "ready" : "pending",
      progress: fulfillment.data?.supplierValidation.valid ? 100 : 30,
    },
    {
      step: "Fulfillment readiness",
      status: fulfillment.data?.readiness.ready ? "ready" : "pending",
      progress: fulfillment.data?.readiness.ready ? 100 : 50,
    },
    {
      step: "Founder approval",
      status: fulfillment.data?.approvalGate.satisfied ? "ready" : "pending",
      progress: fulfillment.data?.approvalGate.satisfied ? 100 : 0,
    },
  ].filter(() => Boolean(fulfillment.data));

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.length > 0 ? (
          data.metrics.map((m) => <StatCard key={m.label} {...m} />)
        ) : (
          <StatCard label="Orders" value="Awaiting implementation" trend="neutral" />
        )}
      </div>
      <ActionButton disabled>Order submit via Brain approval gate</ActionButton>
      <div className="grid gap-6 xl:grid-cols-3">
        <Panel title="Order Queue" subtitle="Live Brain order repository" className="xl:col-span-2">
          {data.orders.length === 0 ? (
            <p className="text-sm text-[#8a847a]">Awaiting implementation — no orders recorded</p>
          ) : (
            <DataTable
              keyField="id"
              data={data.orders}
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
                { key: "date", header: "Date" },
              ]}
            />
          )}
        </Panel>
        <Panel title="Fulfillment Readiness" subtitle="Prepare → Approve → Submit">
          {fulfillment.loading ? (
            <p className="text-sm text-[#8a847a]">Loading fulfillment readiness…</p>
          ) : fulfillmentSteps.length === 0 ? (
            <p className="text-sm text-[#8a847a]">
              Awaiting implementation — no active fulfillment session
            </p>
          ) : (
            <div className="space-y-4">
              {fulfillmentSteps.map((step) => (
                <div key={step.step}>
                  <div className="mb-1 flex justify-between text-sm">
                    <span className="text-[#c8c0b0]">{step.step}</span>
                    <StatusBadge status={step.status} />
                  </div>
                  <div className="h-1.5 rounded-full bg-white/[0.05]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]"
                      style={{ width: `${step.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** SCR-301 — Operations Fulfilment (Brain live — P0-5). */
export function OperationsFulfillmentPanel() {
  const fulfillment = useBrainModule<FulfillmentReadinessSummary>(
    "orders",
    "get_fulfillment_readiness",
  );

  if (fulfillment.loading) {
    return <Panel title="Fulfillment Pipeline">Loading live fulfillment state…</Panel>;
  }

  const steps = fulfillment.data
    ? [
        {
          step: "Supplier validation",
          status: fulfillment.data.supplierValidation.valid ? "ready" : "pending",
          progress: fulfillment.data.supplierValidation.valid ? 100 : 30,
        },
        {
          step: "Fulfillment readiness",
          status: fulfillment.data.readiness.ready ? "ready" : "pending",
          progress: fulfillment.data.readiness.ready ? 100 : 50,
        },
        {
          step: "Founder approval",
          status: fulfillment.data.approvalGate.satisfied ? "ready" : "pending",
          progress: fulfillment.data.approvalGate.satisfied ? 100 : 0,
        },
      ]
    : [];
  const approvalSatisfied = fulfillment.data?.approvalGate.satisfied ?? false;

  return (
    <div className="space-y-6">
      <EngineCenterPanel engineId="logistics" />
      <Panel
        title="Fulfillment Pipeline"
        subtitle={
          approvalSatisfied
            ? "Founder approval satisfied"
            : "Founder approval required before submit"
        }
      >
        {fulfillment.error || steps.length === 0 ? (
          <p className="text-sm text-[#8a847a]">
            Awaiting implementation — start fulfillment preparation via Brain orders module
          </p>
        ) : (
          <div className="space-y-4">
            {steps.map((step) => (
              <div key={step.step} className="rounded-lg border border-gold/10 p-4">
                <div className="flex justify-between">
                  <span className="text-sm text-[#f0d78c]">{step.step}</span>
                  <StatusBadge status={step.status} />
                </div>
                <div className="mt-3 h-2 rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37]"
                    style={{ width: `${step.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>
      <ActionButton disabled={!approvalSatisfied}>
        Approve fulfillment submit
      </ActionButton>
    </div>
  );
}

/** SCR-302 — Operations Customer Support (Brain live — P0-5). */
export function OperationsSupportPanel() {
  const { data, loading, error, reload } = useBrainModule<SupportView>("support");

  if (loading) {
    return <Panel title="Support Queue">Loading live tickets…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Support Queue" subtitle="Brain dispatch unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <ActionButton disabled>Resolve ticket via support agent</ActionButton>
      <Panel title="Support Queue" subtitle="Live Brain ticket repository">
        {data.tickets.length === 0 ? (
          <p className="text-sm text-[#8a847a]">Awaiting implementation — no support tickets</p>
        ) : (
          <DataTable
            keyField="id"
            data={data.tickets}
            columns={[
              { key: "id", header: "Ticket" },
              { key: "customer", header: "Customer" },
              { key: "subject", header: "Subject" },
              { key: "agent", header: "Agent" },
              {
                key: "status",
                header: "Status",
                render: (r) => <StatusBadge status={r.status} />,
              },
              { key: "resolution", header: "Resolution" },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
