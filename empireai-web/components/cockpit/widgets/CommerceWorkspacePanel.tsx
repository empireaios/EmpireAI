"use client";

import Link from "next/link";
import {
  ActionButton,
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { COCKPIT_BASE } from "@/lib/cockpit/types";

type StoreView = {
  companies: Array<{
    id: string;
    name: string;
    category: string;
    status: string;
    revenue: string;
    margin: string;
    agents: number;
  }>;
};

/** SCR-204 — Commerce Business Workspace panel (Brain live — P0-4). */
export function CommerceWorkspacePanel() {
  const { data, loading, error, reload } = useBrainModule<StoreView>("store");

  if (loading) {
    return <Panel title="Business Portfolio">Loading live portfolio…</Panel>;
  }

  if (error || !data) {
    return (
      <Panel title="Business Portfolio" subtitle="Brain dispatch unavailable">
        <button type="button" className="text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const companies = data.companies;
  const building = companies.filter((c) => c.status === "building").length;
  const live = companies.filter((c) => c.status === "live").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Portfolio companies"
          value={companies.length > 0 ? String(companies.length) : "Awaiting implementation"}
          change="Live Brain domain"
          trend="neutral"
        />
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
        {companies.length === 0 ? (
          <p className="text-sm text-[#8a847a]">Awaiting implementation — no companies in workspace</p>
        ) : (
          <DataTable
            keyField="id"
            data={companies}
            columns={[
              {
                key: "name",
                header: "Company",
                render: (row) => (
                  <Link
                    href={`${COCKPIT_BASE}/commerce/workspace/${row.id}`}
                    className="text-[#d4af37] hover:text-[#f0d78c]"
                  >
                    {row.name}
                  </Link>
                ),
              },
              { key: "category", header: "Category" },
              {
                key: "status",
                header: "Status",
                render: (row) => <StatusBadge status={row.status} />,
              },
              { key: "revenue", header: "Revenue" },
              { key: "margin", header: "Margin" },
              { key: "agents", header: "Agents" },
            ]}
          />
        )}
      </Panel>
    </div>
  );
}
