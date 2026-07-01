"use client";

import Link from "next/link";
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
import type { ActivityItem, Company, Metric } from "@/lib/platform/types";

type DashboardView = {
  portfolioMetrics: Metric[];
  companies: Company[];
  recentActivity: ActivityItem[];
};

export function FounderDashboardModule() {
  const { data, loading, error, reload } = useBrainModule<DashboardView>("dashboard");
  const { execute, loading: acting } = useBrainAction();

  return (
    <BrainModuleShell loading={loading} error={error} onRetry={reload}>
      {!data ? null : (
        <>
          <PlatformPageHeader
            eyebrow="Command Center"
            title="Founder Dashboard"
            description="Your sovereign view across every manufactured company, agent, and dollar in the EmpireAI portfolio."
            actions={
              <>
                <ActionButton
                  variant="secondary"
                  disabled={acting}
                  onClick={() => void execute({ module: "dashboard", action: "summarize" })}
                >
                  Export report
                </ActionButton>
                <Link href="/cockpit/command">
                  <ActionButton>Ask AI CEO</ActionButton>
                </Link>
              </>
            }
          />

          <div className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {data.portfolioMetrics.map((metric) => (
              <StatCard key={metric.label} {...metric} />
            ))}
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <Panel
              title="Portfolio Companies"
              subtitle={`${data.companies.length} active ventures`}
              className="xl:col-span-2"
              action={
                <ActionButton variant="ghost" onClick={() => reload()}>
                  View all
                </ActionButton>
              }
            >
              <DataTable
                keyField="id"
                data={data.companies}
                columns={[
                  { key: "name", header: "Company" },
                  { key: "category", header: "Category" },
                  {
                    key: "status",
                    header: "Status",
                    render: (row) => (
                      <Badge
                        variant={
                          row.status === "live"
                            ? "success"
                            : row.status === "building"
                              ? "warning"
                              : "default"
                        }
                      >
                        {String(row.status)}
                      </Badge>
                    ),
                  },
                  { key: "revenue", header: "Revenue" },
                  { key: "margin", header: "Margin" },
                  { key: "agents", header: "Agents" },
                ]}
              />
            </Panel>

            <Panel title="Live Agent Activity" subtitle="Real-time orchestration">
              <ul className="space-y-4">
                {data.recentActivity.map((item) => (
                  <li
                    key={item.id}
                    className="border-b border-gold/5 pb-4 last:border-0 last:pb-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm text-[#c8c0b0]">
                        <span className="font-medium text-[#f0d78c]">
                          {item.agent}
                        </span>{" "}
                        {item.action}
                      </p>
                      <span className="shrink-0 text-[10px] text-[#6f6a60]">
                        {item.timestamp}
                      </span>
                    </div>
                    {item.outcome && (
                      <p className="mt-1 text-xs text-emerald-400/80">
                        {item.outcome}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </Panel>
          </div>
        </>
      )}
    </BrainModuleShell>
  );
}
