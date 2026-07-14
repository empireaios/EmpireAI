"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useGrandKingExecutiveCockpit } from "@/lib/grand-king-executive-cockpit/useGrandKingExecutiveCockpit";

/** Compact Grand King Executive Cockpit strip for Executive Home. */
export function GrandKingExecutiveCockpitStrip() {
  const { view, loading, live } = useGrandKingExecutiveCockpit();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Grand King Executive Cockpit…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/50 bg-gradient-to-r from-amber-500/[0.2] via-gold/10 to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-15 Grand King Cockpit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/grand-king-executive-cockpit" className="text-xs text-[#d4af37] hover:underline">
          Executive command center →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Sovereign Health</p>
          <p className="text-sm text-[#d4af37]">{view.sovereignHealthScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">E5 Engines Active</p>
          <p className="text-sm text-amber-300">
            {view.governanceEnginesActive}/{view.governanceEnginesTotal}
          </p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Unified Visibility</p>
          <p className="text-sm text-[#e8e0d0]">{view.unifiedVisibilityScore}/100</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Cockpit Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.cockpitHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-15 — Permanent Grand King Executive Cockpit panel. */
export function GrandKingExecutiveCockpitDashboard() {
  const { view, loading, error, reload, live, data } = useGrandKingExecutiveCockpit();

  if (loading && !view) {
    return <Panel title="Grand King Executive Cockpit">Loading executive command center…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Grand King Executive Cockpit" subtitle="E5-15 · Constitutional Command Center">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.2] via-gold/10 to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-15 Grand King Executive Cockpit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE516 && (
            <Link href="/cockpit/founder/executive-governance-certification" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-16 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-resilience-engine" className="text-xs text-[#d4af37] hover:underline">
            E5-14 Resilience Engine →
          </Link>
          <Link href="/cockpit/founder/grand-king" className="text-xs text-[#d4af37] hover:underline">
            P8-06 Grand King Operating →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sovereign Health" value={`${view.sovereignHealthScore}/100`} />
        <StatCard label="Governance Chain" value={`${view.governanceChainScore}/100`} />
        <StatCard label="E5 Engines Active" value={`${view.governanceEnginesActive}/${view.governanceEnginesTotal}`} />
        <StatCard label="Cockpit Health" value={view.cockpitHealth} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Unified Visibility" value={`${view.unifiedVisibilityScore}/100`} />
        <StatCard label="Healthy Widgets" value={`${view.healthyWidgetCount}/${view.totalWidgetCount}`} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Executive Dashboard Widgets">
        <DataTable
          columns={[
            { key: "widgetName", header: "Widget" },
            { key: "executiveCategory", header: "Category" },
            { key: "primaryMetric", header: "Primary Metric" },
            { key: "healthStatus", header: "Health" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.executiveDashboardWidgets}
        />
      </Panel>

      <Panel title="E5 Governance Chain">
        <DataTable
          columns={[
            { key: "missionId", header: "Mission" },
            { key: "engineName", header: "Engine" },
            { key: "healthScore", header: "Score" },
            { key: "primaryMetric", header: "Metric" },
            { key: "integrationStatus", header: "Status" },
          ]}
          rows={view.governanceChain}
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {view.governanceChain.map((entry) => (
            <Link
              key={entry.chainId}
              href={entry.route}
              className="rounded border border-gold/20 px-2 py-1 text-xs text-[#d4af37] hover:underline"
            >
              {entry.missionId}
            </Link>
          ))}
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Dashboard Analysis">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.executiveDashboardAnalysis}
          />
        </Panel>

        <Panel title="Pillow Publications">
          <DataTable
            columns={[
              { key: "label", header: "Publication" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.pillowPublications}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Dashboard Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveDashboardPipeline}
          />
        </Panel>

        <Panel title="Cockpit Metrics">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Total widgets: {view.metrics.totalWidgets}</p>
            <p>Governance engines: {view.metrics.governanceEnginesActive}/{view.metrics.governanceEnginesTotal}</p>
            <p>Average confidence: {view.metrics.averageWidgetConfidence}%</p>
            <p>Enterprise health: {view.metrics.enterpriseHealthScore}/100</p>
            <p>Unified visibility: {view.metrics.unifiedVisibilityScore}/100</p>
            <p>Last refresh: {new Date(view.monitoringStatus.lastRefreshAt).toLocaleString()}</p>
          </div>
        </Panel>
      </div>

      <Panel title="Executive Recommendations">
        <div className="space-y-4">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/20 px-4 py-3">
              <p className="font-medium text-[#d4af37]">{rec.title}</p>
              <p className="mt-1 text-sm text-[#c8c0b0]">{rec.why}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                {rec.what} · Confidence {rec.confidencePercent}%
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="list-inside list-disc space-y-1 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="Integration Status">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="rounded border border-gold/10 px-3 py-2 text-xs">
              <p className="text-[#6f6a60]">{key}</p>
              <p className="text-[#e8e0d0]">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
