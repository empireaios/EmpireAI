"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import {
  formatCommerceLabel,
  useCommerceOperatingModel,
} from "@/lib/commerce-operating-model/useCommerceOperatingModel";

/** Compact commerce strip for Executive Home. */
export function CommerceOperatingStrip() {
  const { view, loading, live } = useCommerceOperatingModel();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Commerce Operating Model…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P8-02 Commerce</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.commerceHealth} />
        </div>
        <Link href="/cockpit/commerce/operating" className="text-xs text-[#d4af37] hover:underline">
          Commerce panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-[#d4af37]">{view.revenueSummary}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Profit</p>
          <p className="text-sm text-[#c8c0b0]">{view.profitSummary}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Businesses</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeBusinessCount} · {view.liveBusinessCount} live</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Marketing</p>
          <p className="text-sm text-[#c8c0b0] truncate">{view.marketingSummary}</p>
        </div>
      </div>
    </section>
  );
}

/** P8-02 — Permanent Commerce Operating Model panel. */
export function CommerceOperatingDashboard() {
  const { view, loading, error, reload, live, data } = useCommerceOperatingModel();

  if (loading && !view) {
    return <Panel title="Commerce Operating Model">Loading commerce model…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Commerce Operating Model" subtitle="P8-02 · Economic engine of EmpireAI">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P8-02 Commerce Operating Model</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.commerceHealth} />
          <Link href="/cockpit/commerce/factory" className="text-xs text-[#d4af37] hover:underline">
            Business Factory →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
        <p className="mt-2 text-xs text-[#6f6a60]">
          Factory: {formatCommerceLabel(view.factoryIntegration.factoryStage)} ·{" "}
          {view.factoryIntegration.factoryProgressPercent}% · {view.factoryIntegration.factoryBusinessCount} businesses
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={view.revenueSummary} />
        <StatCard label="Profit" value={view.profitSummary} />
        <StatCard label="Commerce Health" value={view.commerceHealth} />
        <StatCard label="Growth" value={view.growthTrends[0] ?? "Pipeline"} />
      </div>

      <Panel title="Businesses" subtitle={`${view.activeBusinessCount} active · ${view.liveBusinessCount} live`}>
        <DataTable
          columns={[
            { key: "name", header: "Business" },
            { key: "lifecycleStage", header: "Lifecycle", render: (r) => formatCommerceLabel(r.lifecycleStage) },
            { key: "revenue", header: "Revenue" },
            { key: "profit", header: "Profit" },
            { key: "commerceHealth", header: "Health", render: (r) => <StatusBadge status={r.commerceHealth} /> },
          ]}
          rows={view.businesses}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Brands">
          <DataTable
            columns={[
              { key: "name", header: "Brand" },
              { key: "positioning", header: "Positioning" },
            ]}
            rows={view.brands}
          />
        </Panel>
        <Panel title="Stores">
          <DataTable
            columns={[
              { key: "name", header: "Store" },
              { key: "status", header: "Status" },
            ]}
            rows={view.stores}
          />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Products">
          <DataTable
            columns={[
              { key: "name", header: "Product" },
              { key: "category", header: "Category" },
              { key: "marginPercent", header: "Margin", render: (r) => `${r.marginPercent}%` },
            ]}
            rows={view.products}
          />
        </Panel>
        <Panel title="Orders" subtitle={view.orders.length === 0 ? "Pre-launch — no orders yet" : undefined}>
          {view.orders.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">Orders appear when businesses go live</p>
          ) : (
            <DataTable
              columns={[
                { key: "id", header: "Order" },
                { key: "status", header: "Status" },
                { key: "revenue", header: "Revenue" },
                { key: "fulfilment", header: "Fulfilment" },
              ]}
              rows={view.orders}
            />
          )}
        </Panel>
      </div>

      <Panel title="Commerce Pipeline">
        <div className="flex flex-wrap gap-2">
          {view.pipeline.map((stage) => (
            <span
              key={stage.phase}
              className={`rounded px-2 py-1 text-xs ${
                stage.status === "active"
                  ? "bg-gold/20 text-[#f0d78c]"
                  : stage.status === "complete"
                    ? "bg-emerald-900/30 text-emerald-200"
                    : "bg-white/5 text-[#6f6a60]"
              }`}
            >
              {stage.order}. {stage.label}
            </span>
          ))}
        </div>
      </Panel>

      <Panel title="Revenue Model">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.revenueModel.streams.map((stream) => (
            <div key={stream.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm text-[#f0d78c]">{stream.label}</span>
                <StatusBadge status={stream.status} />
              </div>
              <p className="mt-1 text-xs text-[#8a847a]">{stream.summary}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-xs text-[#6f6a60]">
          Allocation: {view.revenueModel.allocation} · Reporting: {view.revenueModel.reporting}
        </p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Current Opportunities">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.currentOpportunities.map((o) => (
              <li key={o}>◆ {o}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Current Risks">
          <ul className="space-y-1 text-sm text-amber-200/90">
            {view.currentRisks.map((r) => (
              <li key={r}>⚠ {r}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Pillow Commerce Intelligence">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Revenue Trends</p>
            <ul className="mt-1 space-y-1 text-sm text-[#c8c0b0]">
              {view.pillow.revenueTrends.map((t) => (
                <li key={t}>◆ {t}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Marketing Performance</p>
            <ul className="mt-1 space-y-1 text-sm text-[#c8c0b0]">
              {view.pillow.marketingPerformance.map((m) => (
                <li key={m}>◆ {m}</li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>
    </div>
  );
}
