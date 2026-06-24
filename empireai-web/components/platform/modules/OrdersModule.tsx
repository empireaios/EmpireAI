"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  DataTable,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { Metric } from "@/lib/platform/types";

type OrdersView = {
  metrics?: Metric[];
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

export function OrdersModule() {
  const { data, loading, error, reload } = useBrainModule<OrdersView>("orders");

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Fulfillment Pipeline"
            title="Order Management"
            description="Unified order flow across every manufactured company — from capture to delivery."
            actions={<ActionButton variant="secondary">Export CSV</ActionButton>}
          />

          {data.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <DataTable
            keyField="id"
            data={data.orders}
            columns={[
              { key: "id", header: "Order" },
              { key: "company", header: "Company" },
              { key: "product", header: "Product" },
              { key: "total", header: "Total" },
              {
                key: "profit",
                header: "Profit",
                render: (row) => (
                  <span className="text-emerald-400">{String(row.profit)}</span>
                ),
              },
              {
                key: "status",
                header: "Status",
                render: (row) => (
                  <Badge
                    variant={
                      row.status === "Delivered"
                        ? "success"
                        : row.status === "Shipped"
                          ? "gold"
                          : "warning"
                    }
                  >
                    {String(row.status)}
                  </Badge>
                ),
              },
              { key: "date", header: "Date" },
            ]}
          />
        </>
      )}
    </BrainModuleShell>
  );
}
