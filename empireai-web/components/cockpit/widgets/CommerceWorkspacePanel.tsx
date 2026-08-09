"use client";

import Link from "next/link";
import {
  DataTable,
  Panel,
  StatCard,
} from "@/components/platform/ui/PlatformPrimitives";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import type { ExecutiveHomeView } from "@/lib/cockpit/panel-types";
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

const SEED_RE = /^(Meridian Commerce|Vertex SaaS|Lumen Media|Atlas Fintech)$/i;

/** SCR-204 — Business Centre · real portfolio + canonical economics. */
export function CommerceWorkspacePanel() {
  const store = useBrainModule<StoreView>("store");
  const home = useBrainModule<ExecutiveHomeView>("executive-home");
  const truth = home.data?.canonicalTruth;

  if (store.loading && home.loading) {
    return <Panel title="Business Centre">Loading live portfolio…</Panel>;
  }

  if ((store.error && !store.data) || (home.error && !home.data)) {
    return (
      <Panel title="Business Centre" subtitle="Brain dispatch unavailable">
        <button
          type="button"
          className="text-sm text-[#d4af37]"
          onClick={() => {
            void store.reload();
            void home.reload();
          }}
        >
          Retry
        </button>
      </Panel>
    );
  }

  const all = store.data?.companies ?? [];
  const companies = all.filter((c) => !SEED_RE.test(c.name));
  const seedCount = all.length - companies.length;
  const building = companies.filter((c) => c.status === "building").length;
  const live = companies.filter((c) => c.status === "live").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <DataModeBadge mode="live" />
        <span className="text-xs text-[#8a847a]">
          Canonical approvals: {truth?.pendingApprovals ?? "—"} · Mission:{" "}
          {truth?.activeMissionHuman ?? "—"}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Active businesses (non-seed)"
          value={String(companies.length)}
          change={seedCount > 0 ? `${seedCount} seed excluded from LIVE` : "Portfolio"}
          trend="neutral"
        />
        <StatCard
          label="Building"
          value={String(building)}
          change={building > 0 ? "Active manufacture" : "None building"}
          trend="neutral"
        />
        <StatCard
          label="Live (non-seed)"
          value={String(live)}
          change={
            truth?.realisedRevenueUsd != null
              ? `Realised $${truth.realisedRevenueUsd.toFixed(2)}`
              : "No realised revenue yet"
          }
          trend="neutral"
        />
      </div>

      <Panel title="Business Portfolio" subtitle="Seed showcase companies excluded from LIVE economics">
        {companies.length === 0 ? (
          <p className="text-sm text-[#8a847a]">
            No non-seed businesses yet. Commerce pre-sale opportunity may still be pending approval.
          </p>
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
              { key: "agents", header: "Agents" },
            ]}
          />
        )}
      </Panel>

      {truth?.commerceOpportunity && (
        <Panel title="Pending commerce opportunity" subtitle="Same canonical source as Executive Home">
          <p className="text-sm text-[#f0d78c]">{truth.commerceOpportunity.productName}</p>
          <p className="mt-1 text-xs text-[#8a847a]">
            ASIN {truth.commerceOpportunity.asin} · expected profit{" "}
            {truth.commerceOpportunity.expectedProfitUsd}
          </p>
          <Link href={`${COCKPIT_BASE}/commerce/store`} className="mt-2 inline-block text-xs text-[#d4af37]">
            Open Commerce Centre →
          </Link>
        </Panel>
      )}
    </div>
  );
}
