"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useGrandKingOperatingAccount } from "@/lib/grand-king-operating-account/useGrandKingOperatingAccount";

/** Compact Grand King strip for Executive Home — capstone of P8 Business layer. */
export function GrandKingStrip() {
  const { view, loading, live } = useGrandKingOperatingAccount();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Grand King Operating Account…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/25 bg-gradient-to-r from-gold/[0.08] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">P8-06 Grand King</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <span className="text-xs text-[#6f6a60]">{view.accountId}</span>
        </div>
        <Link href="/cockpit/founder/grand-king" className="text-xs text-[#d4af37] hover:underline">
          Operating account →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Empire Status</p>
          <p className="text-sm text-[#d4af37]">{view.empireStatus}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-[#e8e0d0]">{view.currentRevenue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Mission</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.currentMission}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">ETA</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.currentEta}</p>
        </div>
      </div>
    </section>
  );
}

/** P8-06 — Permanent Grand King Operating Account panel. */
export function GrandKingOperatingDashboard() {
  const { view, loading, error, reload, live, data } = useGrandKingOperatingAccount();

  if (loading && !view) {
    return <Panel title="Grand King Operating Account">Loading constitutional production account…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Grand King Operating Account" subtitle="P8-06 · Constitutional production reference">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const control = view.executiveControl;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/25 bg-gradient-to-br from-gold/[0.08] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P8-06 Grand King Operating Account</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={control.empireHealth} />
          <span className="text-xs text-[#6f6a60]">
            {view.accountId} · {view.workspaceId}
          </span>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue" value={view.currentRevenue} />
        <StatCard label="Profit" value={view.currentProfit} />
        <StatCard label="Portfolio" value={String(view.businessPortfolio.length)} />
        <StatCard label="Production" value={view.productionHealth} />
      </div>

      <Panel title="Executive Control">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xs text-[#6f6a60]">Current Mission</p>
            <p className="text-sm text-[#e8e0d0]">{control.currentMission}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Journey</p>
            <p className="text-sm text-[#e8e0d0]">{control.journey}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">ETA</p>
            <p className="text-sm text-[#e8e0d0]">{control.eta}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Commerce</p>
            <p className="text-sm text-[#e8e0d0]">{control.commerce}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Business Health</p>
            <p className="text-sm text-[#e8e0d0]">{control.businessHealth}</p>
          </div>
          <div>
            <p className="text-xs text-[#6f6a60]">Empire Health</p>
            <p className="text-sm text-[#e8e0d0]">{control.empireHealth}</p>
          </div>
        </div>
      </Panel>

      <Panel title="Business Portfolio">
        <DataTable
          columns={[
            { key: "name", header: "Business" },
            { key: "stage", header: "Stage" },
            { key: "revenue", header: "Revenue" },
            { key: "profit", header: "Profit" },
            { key: "health", header: "Health" },
          ]}
          rows={view.businessPortfolio}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Opportunities">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.businessOpportunities.length === 0 ? (
              <li className="text-[#6f6a60]">No active opportunities</li>
            ) : (
              view.businessOpportunities.map((item) => (
                <li key={item} className="rounded border border-gold/10 px-3 py-2">
                  {item}
                </li>
              ))
            )}
          </ul>
        </Panel>
        <Panel title="Risks">
          <ul className="space-y-2 text-sm text-[#c8c0b0]">
            {view.businessRisks.length === 0 ? (
              <li className="text-[#6f6a60]">No active risks</li>
            ) : (
              view.businessRisks.map((item) => (
                <li key={item} className="rounded border border-amber-500/20 px-3 py-2 text-amber-100/90">
                  {item}
                </li>
              ))
            )}
          </ul>
        </Panel>
      </div>

      <Panel title="Recommendations">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.recommendations.map((item) => (
            <li key={item} className="rounded border border-gold/10 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Experience Stack">
        <div className="grid gap-3 sm:grid-cols-2">
          {view.experienceStack.map((layer) => (
            <Link
              key={layer.layer}
              href={layer.route}
              className="rounded-lg border border-gold/10 bg-white/[0.02] p-4 transition hover:border-gold/30"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium text-[#f0d78c]">{layer.label}</span>
                <StatusBadge status={layer.status} />
              </div>
              <p className="mt-2 text-xs text-[#8a847a]">{layer.summary}</p>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item} className="rounded border border-gold/10 px-3 py-2">
              {item}
            </li>
          ))}
        </ul>
      </Panel>

      <Panel title="Production Requirements">
        <div className="flex flex-wrap gap-2">
          {view.productionRequirements.map((req) => (
            <Badge key={req} variant="gold">
              {req.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>
    </div>
  );
}
