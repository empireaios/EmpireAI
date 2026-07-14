"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveTransparencyEngine } from "@/lib/executive-transparency-engine/useExecutiveTransparencyEngine";

/** Compact Executive Transparency Engine strip for Executive Home. */
export function ExecutiveTransparencyEngineStrip() {
  const { view, loading, live } = useExecutiveTransparencyEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Transparency Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-07 Transparency</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-transparency" className="text-xs text-[#d4af37] hover:underline">
          Transparency panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Visibility Coverage</p>
          <p className="text-sm text-[#d4af37]">{view.visibilityCoverageScore}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Activity Feed</p>
          <p className="text-sm text-sky-300">{view.executiveActivityFeed.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Restricted</p>
          <p className="text-sm text-[#e8e0d0]">{view.hiddenActionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Transparency Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.transparencyHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-07 — Permanent Executive Transparency Engine panel. */
export function ExecutiveTransparencyEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveTransparencyEngine();

  if (loading && !view) {
    return <Panel title="Executive Transparency Engine">Loading executive transparency engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Transparency Engine" subtitle="E5-07 · Executive Transparency">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-07 Executive Transparency Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE508 && (
            <Link href="/cockpit/founder/executive-exception-manager">
              <Badge variant="gold">E5-08 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-accountability" className="text-xs text-[#d4af37] hover:underline">
            E5-06 Accountability →
          </Link>
          <Link href="/cockpit/founder/executive-ethics" className="text-xs text-[#d4af37] hover:underline">
            E5-05 Ethics →
          </Link>
          <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
            E2-12 Policies →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Transparency Health" value={view.transparencyHealth} />
        <StatCard label="Visibility Coverage" value={`${view.visibilityCoverageScore}%`} />
        <StatCard label="Transparency Records" value={String(view.transparencyRecordCount)} />
        <StatCard label="Restricted Actions" value={String(view.hiddenActionCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fully Visible" value={String(view.fullyVisibleCount)} />
        <StatCard label="Activity Feed Items" value={String(view.executiveActivityFeed.length)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Executive Activity Feed">
        <DataTable
          columns={[
            { key: "activity", header: "Activity" },
            { key: "owner", header: "Owner" },
            { key: "visibilityLevel", header: "Visibility" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveActivityFeed}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Governance Timeline">
          <DataTable
            columns={[
              { key: "event", header: "Event" },
              { key: "owner", header: "Owner" },
              { key: "visibilityLevel", header: "Visibility" },
              { key: "timestamp", header: "Time" },
            ]}
            rows={view.governanceTimeline}
          />
        </Panel>

        <Panel title="Decision Timeline">
          <DataTable
            columns={[
              { key: "decision", header: "Decision" },
              { key: "decisionMaker", header: "Decision Maker" },
              { key: "authority", header: "Authority" },
              { key: "outcome", header: "Outcome" },
            ]}
            rows={view.decisionTimeline}
          />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Repository Activity">
          <DataTable
            columns={[
              { key: "activity", header: "Activity" },
              { key: "owner", header: "Owner" },
              { key: "visibilityLevel", header: "Visibility" },
              { key: "impact", header: "Impact" },
            ]}
            rows={view.repositoryActivity}
          />
        </Panel>

        <Panel title="Mission Status">
          <DataTable
            columns={[
              { key: "mission", header: "Mission" },
              { key: "status", header: "Status" },
              { key: "progress", header: "Progress %" },
              { key: "owner", header: "Owner" },
            ]}
            rows={view.missionStatus}
          />
        </Panel>
      </div>

      <Panel title="Programme Status">
        <DataTable
          columns={[
            { key: "programme", header: "Programme" },
            { key: "phase", header: "Phase" },
            { key: "status", header: "Status" },
            { key: "owner", header: "Owner" },
          ]}
          rows={view.programmeStatus}
        />
      </Panel>

      <Panel title="Transparency Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.transparencyAnalysis}
        />
      </Panel>

      <Panel title="Executive Transparency Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveTransparencyPipeline}
        />
      </Panel>

      <Panel title="Executive Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "confidencePercent", header: "Confidence" },
            { key: "what", header: "Action" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Pillow Transparency Publications">
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
  );
}
