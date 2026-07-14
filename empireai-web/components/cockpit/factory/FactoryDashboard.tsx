"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { formatFactoryStage, useBusinessFactory } from "@/lib/business-factory/useBusinessFactory";

function PipelineBar({
  pipeline,
}: {
  pipeline: Array<{ label: string; status: string; order: number }>;
}) {
  return (
    <div className="flex flex-wrap gap-1">
      {pipeline.map((stage) => (
        <span
          key={stage.order}
          className={`rounded px-2 py-0.5 text-[10px] ${
            stage.status === "complete"
              ? "bg-emerald-900/40 text-emerald-200"
              : stage.status === "active"
                ? "bg-gold/20 text-[#f0d78c]"
                : "bg-white/5 text-[#6f6a60]"
          }`}
          title={stage.label}
        >
          {stage.order}
        </span>
      ))}
    </div>
  );
}

/** Compact factory strip for Executive Home. */
export function FactoryStrip() {
  const { view, loading, live } = useBusinessFactory();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Business Factory…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P8-01 Business Factory</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/commerce/factory" className="text-xs text-[#d4af37] hover:underline">
          Open Factory →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Stage</p>
          <p className="text-sm text-[#e8e0d0]">{formatFactoryStage(view.currentFactoryStage)}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Businesses</p>
          <p className="text-sm text-[#d4af37]">{view.activeBusinessCount} active · {view.liveBusinessCount} live</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-[#c8c0b0]">{view.revenueSummary}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Launch</p>
          <p className="text-sm text-[#c8c0b0]">{view.launchStatus}</p>
        </div>
      </div>
    </section>
  );
}

/** P8-01 — Permanent Business Factory panel. */
export function FactoryDashboard() {
  const { view, loading, error, reload, live, data } = useBusinessFactory();

  if (loading && !view) {
    return <Panel title="Business Factory">Loading factory pipeline…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Business Factory" subtitle="P8-01 · Factory That Manufactures Companies">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const businessColumns = [
    { key: "name", header: "Business" },
    {
      key: "stage",
      header: "Stage",
      render: (row: (typeof view.businesses)[0]) => formatFactoryStage(row.stage),
    },
    { key: "progressPercent", header: "Progress", render: (row: (typeof view.businesses)[0]) => `${row.progressPercent}%` },
    { key: "launchStatus", header: "Launch" },
    { key: "health", header: "Health", render: (row: (typeof view.businesses)[0]) => <StatusBadge status={row.health} /> },
    { key: "revenue", header: "Revenue" },
    { key: "growth", header: "Growth" },
  ];

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P8-01 Business Factory</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Factory Stage" value={formatFactoryStage(view.currentFactoryStage)} />
        <StatCard label="Pipeline Progress" value={`${view.pipelineProgressPercent}%`} />
        <StatCard label="Revenue" value={view.revenueSummary} />
        <StatCard label="Growth" value={view.growthSummary} />
      </div>

      <Panel title="Businesses" subtitle={`${view.activeBusinessCount} in factory · ${view.liveBusinessCount} live`}>
        <DataTable columns={businessColumns} rows={view.businesses} />
      </Panel>

      <Panel title="Factory Pipeline" subtitle="Vision → Opportunity → Launch → Operation → Growth">
        <PipelineBar pipeline={view.pipeline} />
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.pipeline.map((stage) => (
            <div
              key={stage.phase}
              className={`rounded-lg border px-3 py-2 text-xs ${
                stage.status === "active"
                  ? "border-gold/40 bg-gold/[0.06]"
                  : stage.status === "complete"
                    ? "border-emerald-900/30 bg-emerald-950/20"
                    : "border-gold/10 bg-white/[0.02]"
              }`}
            >
              <span className="text-[#6f6a60]">{stage.order}.</span> {stage.label}
            </div>
          ))}
        </div>
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

      <Panel title="Pillow Factory Intelligence">
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Commercial Recommendations</p>
            <ul className="mt-1 space-y-1 text-sm text-[#c8c0b0]">
              {view.pillow.commercialRecommendations.map((r) => (
                <li key={r}>◆ {r}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[10px] uppercase text-[#6f6a60]">Improvements</p>
            <ul className="mt-1 space-y-1 text-sm text-[#c8c0b0]">
              {view.pillow.improvements.map((i) => (
                <li key={i}>◆ {i}</li>
              ))}
            </ul>
          </div>
        </div>
      </Panel>

      <Panel title="System Coordination" subtitle="Pillow · ECC · Supervisor · Guardian · Journey · Production">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {view.coordination.map((c) => (
            <div key={c.system} className="rounded-lg border border-gold/10 bg-white/[0.02] p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[#f0d78c]">{c.system}</span>
                <StatusBadge status={c.status} />
              </div>
              <p className="mt-2 text-xs text-[#8a847a]">{c.summary}</p>
              {c.notes.length > 0 && (
                <ul className="mt-2 space-y-0.5 text-xs text-[#6f6a60]">
                  {c.notes.map((n) => (
                    <li key={n}>· {n}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
