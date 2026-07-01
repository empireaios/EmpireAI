"use client";

import { BrainModuleShell } from "@/components/platform/brain/BrainModuleShell";
import {
  ActionButton,
  Badge,
  DataTable,
  Panel,
  PlatformPageHeader,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { useBrainAction } from "@/lib/brain/hooks/useBrainAction";
import type { Metric } from "@/lib/platform/types";

type SupportView = {
  metrics?: Metric[];
  tickets: Array<{
    id: string;
    subject: string;
    customer: string;
    status: string;
    agent: string;
    resolution: string;
  }>;
};

export function SupportModule() {
  const { data, loading, error, reload } = useBrainModule<SupportView>("support");
  const { execute, loading: resolving } = useBrainAction();

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Customer Intelligence"
            title="Customer Support AI"
            description="Nova resolves customer inquiries autonomously with 96% satisfaction — escalating only when human judgment is required."
            actions={
              <ActionButton
                disabled={resolving}
                onClick={() =>
                  void execute({ module: "support", action: "resolve", payload: { filter: "escalations" } }).then(
                    () => reload(),
                  )
                }
              >
                View escalations
              </ActionButton>
            }
          />

          {data.metrics && (
            <div className="mb-8 grid gap-4 sm:grid-cols-4">
              {data.metrics.map((metric) => (
                <StatCard key={metric.label} {...metric} />
              ))}
            </div>
          )}

          <Panel title="Recent Tickets" subtitle="Nova · Support Agent">
            <DataTable
              keyField="id"
              data={data.tickets}
              columns={[
                { key: "subject", header: "Subject" },
                { key: "customer", header: "Customer" },
                {
                  key: "status",
                  header: "Status",
                  render: (row) => (
                    <Badge variant={row.status === "Resolved" ? "success" : "warning"}>
                      {String(row.status)}
                    </Badge>
                  ),
                },
                { key: "agent", header: "Agent" },
                { key: "resolution", header: "Time" },
              ]}
            />
          </Panel>
        </>
      )}
    </BrainModuleShell>
  );
}
