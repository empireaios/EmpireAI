"use client";

import Link from "next/link";
import {
  ActionButton,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { COMMERCE_WORKSPACE_COMPANIES } from "@/components/cockpit/widgets/commerce/commerceWorkspaceDemoData";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

/** SCR-204 — Commerce Business Workspace panel (presentation-only demo). */
export function CommerceWorkspacePanel() {
  const building = COMMERCE_WORKSPACE_COMPANIES.filter((c) => c.status === "building").length;
  const live = COMMERCE_WORKSPACE_COMPANIES.filter((c) => c.status === "live").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Portfolio companies" value={String(COMMERCE_WORKSPACE_COMPANIES.length)} change="Demo portfolio" trend="neutral" />
        <StatCard label="Building" value={String(building)} change="Active manufacture" trend="up" />
        <StatCard label="Live" value={String(live)} change="Revenue generating" trend="up" />
      </div>

      <div className="flex flex-wrap gap-2">
        <ActionButton disabled>Start new company</ActionButton>
        <ActionButton variant="secondary" disabled>
          Compare opportunities
        </ActionButton>
      </div>

      <Panel title="Business Portfolio" subtitle="Select a company for workspace detail">
        <DataTable
          keyField="id"
          data={COMMERCE_WORKSPACE_COMPANIES}
          columns={[
            {
              key: "name",
              header: "Company",
              render: (row) => (
                <Link
                  href={`${COCKPIT_BASE}/commerce/workspace/${row.id}`}
                  className="text-[#d4af37] hover:underline"
                >
                  {row.name}
                </Link>
              ),
            },
            { key: "niche", header: "Niche" },
            {
              key: "status",
              header: "Status",
              render: (row) => <StatusBadge status={row.status} />,
            },
            { key: "revenue", header: "Revenue" },
            {
              key: "buildProgress",
              header: "Build",
              render: (row) => `${row.buildProgress}%`,
            },
            { key: "agent", header: "Lead agent" },
          ]}
        />
      </Panel>
    </div>
  );
}
