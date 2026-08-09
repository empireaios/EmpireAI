"use client";

import Link from "next/link";
import {
  Badge,
  Panel,
} from "@/components/platform/ui/PlatformPrimitives";
import { useBrainModule } from "@/lib/brain/hooks/useBrainModule";
import { EngineCenterPanel } from "@/components/cockpit/widgets/EnginePanelFrame";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
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
  buildStages: Array<{
    stage: string;
    progress: number;
    status: string;
  }>;
  buildingCompany: {
    id: string;
    name: string;
    progress: number;
  } | null;
};

const SEED_RE = /^(Meridian Commerce|Vertex SaaS|Lumen Media|Atlas Fintech)$/i;

/** SCR-200 — Commerce Centre · live opportunity + store pipeline. */
export function CommerceStorePanel() {
  const store = useBrainModule<StoreView>("store");
  const home = useBrainModule<ExecutiveHomeView>("executive-home");
  const truth = home.data?.canonicalTruth;
  const opp = truth?.commerceOpportunity ?? null;

  if (store.loading && home.loading) {
    return <Panel title="Commerce Centre">Loading live commerce state…</Panel>;
  }

  if ((store.error && !store.data) || (home.error && !home.data)) {
    return (
      <Panel title="Commerce Centre" subtitle="Brain dispatch unavailable">
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

  const data = store.data;
  const building = data?.buildingCompany ?? null;
  const companies = (data?.companies ?? []).filter((c) => !SEED_RE.test(c.name));
  const seedCount = (data?.companies ?? []).length - companies.length;
  const liveCount = companies.filter((c) => c.status === "live").length;
  const buildingCount = companies.filter((c) => c.status === "building").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <DataModeBadge mode="live" />
        <Badge variant="gold">Commerce Centre</Badge>
        <span className="text-xs text-[#8a847a]">
          Approvals: {truth?.pendingApprovals ?? "—"} · Realised revenue:{" "}
          {truth?.realisedRevenueUsd != null
            ? `$${truth.realisedRevenueUsd.toFixed(2)}`
            : "No realised revenue yet"}
        </span>
        <button
          type="button"
          className="ml-auto text-xs text-[#d4af37]"
          onClick={() => {
            void store.reload();
            void home.reload();
          }}
        >
          Refresh
        </button>
      </div>

      <Panel
        title="Top Opportunity"
        subtitle={
          opp
            ? "Pillow recommendation · Grand King approval required before publish/spend"
            : "No qualified opportunity awaiting approval"
        }
      >
        {opp ? (
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p className="font-display text-xl text-[#f0d78c]">{opp.productName}</p>
            <p>
              ASIN {opp.asin} · CJ {opp.cjPid} · SKU {opp.amazonSellerSku}
            </p>
            <p>
              Offer {opp.offerPrice} · Expected profit {opp.expectedProfitUsd} · Margin{" "}
              {opp.expectedMarginPct}
            </p>
            <p className="text-xs text-[#8a847a]">{opp.summary}</p>
            <p className="text-amber-200">
              Disposition: {opp.disposition} · Approval: {opp.approvalStatus}
            </p>
            <Link href={`${COCKPIT_BASE}/development/pillow`} className="text-[#d4af37] hover:underline">
              Review in Pillow Centre →
            </Link>
          </div>
        ) : (
          <p className="text-sm text-[#8a847a]">
            Pillow continues autonomous discovery. No publish or supplier spend without approval.
          </p>
        )}
      </Panel>

      <EngineCenterPanel engineId="storefront" />

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="warning">Building {buildingCount}</Badge>
        <Badge variant="gold">
          Pipeline {building ? `${building.progress}%` : "No active build"}
        </Badge>
        <Badge variant="success">Live (non-seed) {liveCount}</Badge>
        {seedCount > 0 && (
          <Badge variant="default">{seedCount} seed showcase (not LIVE economics)</Badge>
        )}
      </div>

      <div className="rounded-xl border border-gold/20 bg-white/[0.02] p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Badge variant={building ? "warning" : "default"}>
              {building ? "Building" : "Idle"}
            </Badge>
            <h2 className="mt-2 font-display text-2xl text-[#f0d78c]">
              {building?.name ?? "No store build in progress"}
            </h2>
            <p className="text-sm text-[#8a847a]">
              Store Builder · {companies.length} non-seed companies
              {seedCount > 0 ? ` · ${seedCount} seed excluded from LIVE economics` : ""}
            </p>
          </div>
          <p className="font-display text-4xl text-[#d4af37]">
            {building ? `${building.progress}%` : "—"}
          </p>
        </div>
      </div>

      <Panel title="Build Pipeline" subtitle={building?.name ?? "No active build"}>
        {!data || data.buildStages.length === 0 ? (
          <p className="text-sm text-[#8a847a]">No active build stages.</p>
        ) : (
          <div className="space-y-4">
            {data.buildStages.map((stage) => (
              <div key={stage.stage}>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-[#c8c0b0]">{stage.stage}</span>
                  <Badge
                    variant={
                      stage.status === "complete"
                        ? "success"
                        : stage.status === "in_progress"
                          ? "gold"
                          : "default"
                    }
                  >
                    {stage.status.replace("_", " ")}
                  </Badge>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#b8922a] to-[#d4af37] transition-all duration-700"
                    style={{ width: `${stage.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel title="Portfolio Companies" subtitle="Non-seed businesses · seed showcase excluded">
        {companies.length === 0 ? (
          <p className="text-sm text-[#8a847a]">
            No non-seed companies in workspace yet. Seed portfolio figures are not LIVE realised economics.
          </p>
        ) : (
          <ul className="space-y-3">
            {companies.map((company) => (
              <li
                key={company.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gold/10 p-3"
              >
                <div>
                  <p className="text-sm font-medium text-[#f0d78c]">{company.name}</p>
                  <p className="text-xs text-[#8a847a]">
                    {company.category} · status {company.status}
                  </p>
                </div>
                <Badge
                  variant={
                    company.status === "live"
                      ? "success"
                      : company.status === "building"
                        ? "gold"
                        : "default"
                  }
                >
                  {company.status}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
