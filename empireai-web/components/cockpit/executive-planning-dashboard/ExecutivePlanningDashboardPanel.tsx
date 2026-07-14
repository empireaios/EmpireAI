"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutivePlanningDashboard } from "@/lib/executive-planning-dashboard/useExecutivePlanningDashboard";

/** Compact Executive Planning Dashboard strip for Executive Home. */
export function ExecutivePlanningDashboardStrip() {
  const { view, loading, live } = useExecutivePlanningDashboard();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Planning Dashboard…
      </section>
    );
  }

  if (!view) return null;

  const summary = view.executiveSummary;

  return (
    <section className="rounded-xl border border-gold/50 bg-gradient-to-r from-gold/[0.2] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-14 Planning Command</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
          Full planning dashboard →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Planning Health</p>
          <p className="text-sm text-[#d4af37]">{summary.overallPlanningHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{summary.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Execution Readiness</p>
          <p className="text-sm text-[#e8e0d0]">{summary.executionReadiness}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Widgets</p>
          <p className="text-sm text-[#e8e0d0]">{view.planningWidgets.length} engines</p>
        </div>
      </div>
    </section>
  );
}

/** E1-14 — Permanent Executive Planning Dashboard (unified command center). */
export function ExecutivePlanningDashboardPanel() {
  const { view, loading, error, reload, live, data } = useExecutivePlanningDashboard();

  if (loading && !view) {
    return <Panel title="Executive Planning Dashboard">Loading unified planning dashboard…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Planning Dashboard" subtitle="E1-14 · Unified Command Center">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const summary = view.executiveSummary;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/50 bg-gradient-to-br from-gold/[0.2] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-14 Executive Planning Dashboard</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE115 && <Badge variant="gold">E1 Certified</Badge>}
          <Link href="/cockpit/founder/executive-planning-certification" className="text-xs text-[#d4af37] hover:underline">
            E1 Certification →
          </Link>
          <Link href="/cockpit/founder" className="text-xs text-[#d4af37] hover:underline">
            Executive Cockpit →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Real-time · Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-3 text-sm text-[#c8c0b0]">{view.dashboardSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Overall Planning Health" value={summary.overallPlanningHealth} />
        <StatCard label="Vision Alignment" value={summary.visionAlignment} />
        <StatCard label="Growth Readiness" value={summary.growthReadiness} />
        <StatCard label="Execution Readiness" value={summary.executionReadiness} />
      </div>

      <Panel title="Executive Summary">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 text-sm text-[#c8c0b0]">
          <div><span className="text-[#6f6a60]">Programme Progress:</span> {summary.programmeProgress}</div>
          <div><span className="text-[#6f6a60]">Priority Status:</span> {summary.priorityStatus}</div>
          <div><span className="text-[#6f6a60]">Strategic Risks:</span> {summary.strategicRisks}</div>
          <div><span className="text-[#6f6a60]">Strategic Opportunities:</span> {summary.strategicOpportunities}</div>
          <div className="sm:col-span-2 lg:col-span-2">
            <span className="text-[#6f6a60]">Current Recommendation:</span> {summary.currentRecommendation}
          </div>
        </div>
      </Panel>

      <Panel title="Planning Widgets">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {view.planningWidgets.map((widget) => (
            <Link
              key={widget.widgetId}
              href={widget.href}
              className="rounded-lg border border-gold/20 bg-black/20 p-4 transition hover:border-gold/40"
            >
              <div className="flex items-center justify-between gap-2">
                <Badge variant="gold">{widget.engineId}</Badge>
                <span className="text-xs text-[#6f6a60]">{widget.healthScore}/100</span>
              </div>
              <p className="mt-2 font-medium text-[#f0d78c]">{widget.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[#8a847a]">{widget.summary}</p>
              <p className="mt-2 text-xs text-[#6f6a60]">
                {widget.keyMetric}: <span className="text-[#e8e0d0]">{widget.keyValue}</span>
              </p>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Executive Navigation">
        <div className="flex flex-wrap gap-2">
          {view.navigationLinks.map((link) => (
            <Link
              key={link.target}
              href={link.href}
              className="rounded-md border border-gold/25 px-3 py-1.5 text-xs text-[#d4af37] hover:border-gold/50 hover:bg-gold/5"
              title={link.description}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title="Executive Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "source", header: "Source" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.executiveRecommendations}
        />
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

      <Panel title="E1 Engine Integrations">
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
