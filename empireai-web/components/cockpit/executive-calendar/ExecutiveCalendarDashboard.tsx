"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveCalendarEngine } from "@/lib/executive-calendar-engine/useExecutiveCalendarEngine";

/** Compact Executive Calendar strip for Executive Home. */
export function ExecutiveCalendarStrip() {
  const { view, loading, live } = useExecutiveCalendarEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Calendar…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-08 Calendar</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-calendar" className="text-xs text-[#d4af37] hover:underline">
          Calendar panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Calendar Health</p>
          <p className="text-sm text-[#d4af37]">{view.calendarHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Today&apos;s Agenda</p>
          <p className="text-sm text-[#e8e0d0]">{view.todaysAgenda.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Events</p>
          <p className="text-sm text-[#e8e0d0]">{view.criticalEventCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Planning Cadence</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.planningCadence}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-08 — Permanent Executive Calendar Engine panel. */
export function ExecutiveCalendarDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveCalendarEngine();

  if (loading && !view) {
    return <Panel title="Executive Calendar">Loading calendar engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Calendar" subtitle="E1-08 · Executive Calendar Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-08 Executive Calendar</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE109 && <Badge variant="gold">Ready for E1-09</Badge>}
          <Link href="/cockpit/founder/executive-dependencies" className="text-xs text-[#d4af37] hover:underline">
            Executive Dependencies →
          </Link>
          <Link href="/cockpit/founder/department-planning" className="text-xs text-[#d4af37] hover:underline">
            Department Planning →
          </Link>
          <Link href="/cockpit/founder/executive-roadmap" className="text-xs text-[#d4af37] hover:underline">
            Executive Roadmap →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.calendarSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Calendar Health" value={view.calendarHealth} />
        <StatCard label="Schedule Health" value={view.scheduleHealth} />
        <StatCard label="Upcoming Events" value={String(view.upcomingEventCount)} />
        <StatCard label="Critical Events" value={String(view.criticalEventCount)} />
      </div>

      <Panel title="Today's Executive Agenda">
        <DataTable
          columns={[
            { key: "title", header: "Event" },
            { key: "owner", header: "Owner" },
            { key: "scheduledDate", header: "Date" },
            { key: "expectedDuration", header: "Duration" },
            { key: "status", header: "Status" },
            { key: "whyItMatters", header: "Why It Matters" },
          ]}
          rows={view.todaysAgenda}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Upcoming Reviews">
          <DataTable
            columns={[
              { key: "title", header: "Review" },
              { key: "scheduledDate", header: "Date" },
              { key: "owner", header: "Owner" },
              { key: "priority", header: "Priority" },
            ]}
            rows={view.upcomingReviews}
          />
        </Panel>

        <Panel title="Programme Milestones">
          <DataTable
            columns={[
              { key: "title", header: "Milestone" },
              { key: "scheduledDate", header: "Date" },
              { key: "status", header: "Status" },
              { key: "relatedProgrammes", header: "Programme" },
            ]}
            rows={view.programmeMilestones.map((e) => ({
              ...e,
              relatedProgrammes: e.relatedProgrammes.join(", "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Critical Events">
        <DataTable
          columns={[
            { key: "title", header: "Event" },
            { key: "scheduledDate", header: "Date" },
            { key: "priority", header: "Priority" },
            { key: "dependencies", header: "Dependencies" },
            { key: "whyItMatters", header: "Why It Matters" },
          ]}
          rows={view.criticalEvents.map((e) => ({
            ...e,
            dependencies: e.dependencies.length ? e.dependencies.join(", ") : "None",
          }))}
        />
      </Panel>

      <Panel title="Executive Cadence">
        <DataTable
          columns={[
            { key: "label", header: "Cadence" },
            { key: "frequency", header: "Frequency" },
            { key: "nextOccurrence", header: "Next" },
            { key: "owner", header: "Owner" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveCadence}
        />
      </Panel>

      <Panel title="Calendar Segments">
        <DataTable
          columns={[
            { key: "label", header: "Segment" },
            { key: "count", header: "Count" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.calendarSegments}
        />
      </Panel>

      <Panel title="Calendar Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.calendarHierarchy}
        />
      </Panel>

      <Panel title="Calendar Lifecycle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.calendarLifecycle.map((step) => (
            <div
              key={step.phase}
              className="flex items-center justify-between rounded border border-gold/10 px-3 py-2 text-sm"
            >
              <span className="text-[#c8c0b0]">{step.label}</span>
              <StatusBadge status={step.status} />
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Recommendations">
        <div className="grid gap-3 lg:grid-cols-2">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
              <div className="flex items-center gap-2">
                <Badge variant="gold">{rec.category}</Badge>
                <span className="text-xs text-[#6f6a60]">{rec.confidencePercent}%</span>
              </div>
              <h4 className="mt-2 font-medium text-[#f0d78c]">{rec.title}</h4>
              <p className="mt-1 text-xs text-[#8a847a]">{rec.how}</p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Calendar Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>

      <Panel title="Cross-System Integrations">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="flex justify-between gap-4 border-b border-gold/5 py-2">
              <span className="text-[#6f6a60]">{key.replace(/([A-Z])/g, " $1")}</span>
              <span className="text-[#e8e0d0]">{value}</span>
            </div>
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
    </div>
  );
}
