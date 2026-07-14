"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCommercialIntelligence } from "@/lib/commercial-intelligence/useCommercialIntelligence";
import type { CommercialInsight } from "@/lib/commercial-intelligence/types";

function InsightCard({ insight }: { insight: CommercialInsight }) {
  return (
    <div className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="gold">{insight.classification}</Badge>
        <span className="text-xs text-[#6f6a60]">{insight.confidencePercent}% · {insight.confidenceLabel}</span>
      </div>
      <h4 className="mt-2 font-medium text-[#f0d78c]">{insight.title}</h4>
      <p className="mt-2 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHY:</span> {insight.why}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">WHAT:</span> {insight.what}</p>
      <p className="mt-1 text-xs text-[#8a847a]"><span className="text-[#6f6a60]">HOW:</span> {insight.how}</p>
      <p className="mt-1 text-xs text-[#6f6a60]">Impact: {insight.businessImpact}</p>
    </div>
  );
}

/** Compact intelligence strip for Executive Home. */
export function CommercialIntelligenceStrip() {
  const { view, loading, live } = useCommercialIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Commercial Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/20 bg-gradient-to-r from-gold/[0.05] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P8-05 Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/commerce/intelligence" className="text-xs text-[#d4af37] hover:underline">
          Intelligence panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div>
          <p className="text-xs text-[#6f6a60]">Winning Products</p>
          <p className="text-sm text-[#d4af37]">{view.winningProducts.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Opportunities</p>
          <p className="text-sm text-[#e8e0d0]">{view.currentOpportunities.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Risks</p>
          <p className="text-sm text-amber-200/90">{view.currentRisks.length}</p>
        </div>
      </div>
    </section>
  );
}

/** P8-05 — Permanent Commercial Intelligence Architecture panel. */
export function CommercialIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useCommercialIntelligence();

  if (loading && !view) {
    return <Panel title="Commercial Intelligence">Loading intelligence analysis…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Commercial Intelligence" subtitle="P8-05 · Automation executes · Intelligence decides">
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
          <Badge variant="gold">P8-05 Commercial Intelligence</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.businessHealth} />
          <Link href="/cockpit/commerce/operating" className="text-xs text-[#d4af37] hover:underline">
            Commerce →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary.slice(0, 400)}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Winning Products" value={String(view.winningProducts.length)} />
        <StatCard label="Opportunities" value={String(view.currentOpportunities.length)} />
        <StatCard label="Risks" value={String(view.currentRisks.length)} />
        <StatCard label="Recommendations" value={String(view.recommendations.length)} />
      </div>

      <Panel title="Winning Products">
        <DataTable
          columns={[
            { key: "name", header: "Product" },
            { key: "score", header: "Score" },
            { key: "marginPercent", header: "Margin", render: (r) => `${r.marginPercent}%` },
            { key: "rationale", header: "Rationale" },
          ]}
          rows={view.winningProducts}
        />
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Revenue & Profit Trends">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.revenueTrends.map((t) => (
              <li key={t}>◆ Revenue: {t}</li>
            ))}
            {view.profitTrends.map((t) => (
              <li key={t}>◆ Profit: {t}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Growth Trends">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.growthTrends.map((t) => (
              <li key={t}>◆ {t}</li>
            ))}
          </ul>
        </Panel>
      </div>

      <Panel title="Current Opportunities">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.currentOpportunities.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      </Panel>

      <Panel title="Current Risks">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.currentRisks.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      </Panel>

      <Panel title="Recommendations" subtitle="WHY · WHAT · HOW · PROOF · Confidence · Impact">
        <div className="grid gap-4 lg:grid-cols-2">
          {view.recommendations.map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </div>
      </Panel>

      <Panel title="Intelligence Pipeline">
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
    </div>
  );
}
