"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutivePerformanceDashboard } from "@/lib/executive-performance-dashboard/useExecutivePerformanceDashboard";

/** Compact Executive Performance Dashboard strip for Executive Home. */
export function ExecutivePerformanceDashboardStrip() {
  const { view, loading, live } = useExecutivePerformanceDashboard();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Performance Dashboard…
      </section>
    );
  }

  if (!view) return null;

  const s = view.executiveSummary;

  return (
    <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-r from-emerald-500/[0.2] via-[#d4af37]/10 to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-13 Command Center</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={s.healthScore >= 85 ? "healthy" : s.healthScore >= 70 ? "stable" : "attention"} />
        </div>
        <Link href="/cockpit/founder/executive-performance" className="text-xs text-[#d4af37] hover:underline">
          Full dashboard →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <div>
          <p className="text-xs text-[#6f6a60]">Revenue</p>
          <p className="text-sm text-[#d4af37]">{s.revenue}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Profit</p>
          <p className="text-sm text-emerald-300">{s.profit}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Cash</p>
          <p className="text-sm text-[#e8e0d0]">{s.cashPosition}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">ROI</p>
          <p className="text-sm text-[#e8e0d0]">{s.roi}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Health</p>
          <p className="text-sm text-[#e8e0d0]">{s.overallFinancialHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-13 — Permanent Executive Performance Dashboard (unified financial command center). */
export function ExecutivePerformanceDashboardPanel() {
  const { view, loading, error, reload, live, data } = useExecutivePerformanceDashboard();

  if (loading && !view) {
    return <Panel title="Executive Performance">Loading executive performance dashboard…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Performance" subtitle="E3-13 · Executive Performance Dashboard">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const s = view.executiveSummary;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] via-[#d4af37]/[0.08] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-13 Executive Performance Dashboard</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE314 && (
            <Link href="/cockpit/founder/enterprise-valuation">
              <Badge variant="gold">E3-14 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Finance Framework →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · {view.realtimePollIntervalMs / 1000}s auto-refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.dashboardSummary}</p>
      </section>

      <section className="rounded-xl border border-gold/30 bg-[#1a1814]/60 px-5 py-4">
        <h2 className="mb-4 font-display text-lg text-[#f0d78c]">Executive Summary</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Financial Health" value={s.overallFinancialHealth} />
          <StatCard label="Revenue" value={s.revenue} />
          <StatCard label="Profit" value={s.profit} />
          <StatCard label="Cash Position" value={s.cashPosition} />
          <StatCard label="ROI" value={s.roi} />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Budget Utilization" value={s.budgetUtilization} />
          <StatCard label="Capital Risk" value={s.capitalRisk} />
          <StatCard label="Forecast Outlook" value={s.forecastOutlook} />
          <StatCard label="Financial Readiness" value={s.financialReadiness} />
        </div>
        <p className="mt-4 text-sm text-[#c8c0b0]">
          <span className="text-[#d4af37]">Current Recommendation:</span> {s.currentRecommendation}
        </p>
      </section>

      <section>
        <h2 className="mb-4 font-display text-lg text-[#f0d78c]">Financial Widgets</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {view.financialWidgets.map((widget) => (
            <Link
              key={widget.widgetId}
              href={widget.href}
              className="group rounded-xl border border-gold/20 bg-[#1a1814]/40 p-4 transition hover:border-emerald-500/50 hover:bg-emerald-500/[0.05]"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="gold">{widget.engineId}</Badge>
                <span className="text-xs text-[#6f6a60]">{widget.confidence}%</span>
              </div>
              <h3 className="mt-2 text-sm font-medium text-[#f0d78c] group-hover:text-emerald-300">{widget.title}</h3>
              <p className="mt-1 text-xs text-[#6f6a60]">{widget.metric}</p>
              <p className="mt-1 text-lg text-[#d4af37]">{widget.value}</p>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-[#8a847a]">{widget.status}</span>
                <span className="text-emerald-400/80">{widget.trend}</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Panel title="Executive Navigation">
        <div className="flex flex-wrap gap-2">
          {view.executiveNavigation.map((nav) => (
            <Link
              key={nav.target}
              href={nav.href}
              className="rounded-lg border border-gold/20 px-3 py-2 text-xs text-[#c8c0b0] transition hover:border-[#d4af37] hover:text-[#d4af37]"
            >
              <span className="text-[#d4af37]">{nav.engineId}</span> · {nav.label}
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Pillow Publications">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.pillowPublications}
          />
        </Panel>
        <Panel title="ECC Publications">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.eccPublications}
          />
        </Panel>
        <Panel title="Supervisor Publications">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.supervisorPublications}
          />
        </Panel>
      </div>

      <Panel title="Consolidated Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "source", header: "Source" },
            { key: "category", header: "Category" },
            { key: "priority", header: "Priority" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.consolidatedRecommendations}
        />
      </Panel>

      <Panel title="Real-Time Update Triggers">
        <div className="flex flex-wrap gap-2">
          {view.realtimeUpdateTriggers.map((trigger) => (
            <Badge key={trigger} variant="gold">
              {trigger.replace(/_/g, " ")}
            </Badge>
          ))}
        </div>
      </Panel>

      <Panel title="Integrations">
        <DataTable
          columns={[
            { key: "engine", header: "Engine" },
            { key: "status", header: "Status" },
          ]}
          rows={Object.entries(view.integrations).map(([engine, status]) => ({ engine, status }))}
        />
      </Panel>
    </div>
  );
}
