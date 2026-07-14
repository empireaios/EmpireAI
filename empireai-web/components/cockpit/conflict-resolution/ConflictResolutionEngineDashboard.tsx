"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useConflictResolutionEngine } from "@/lib/conflict-resolution-engine/useConflictResolutionEngine";

/** Compact Conflict Resolution Engine strip for Executive Home. */
export function ConflictResolutionEngineStrip() {
  const { view, loading, live } = useConflictResolutionEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Conflict Resolution Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-rose-500/30 bg-gradient-to-r from-rose-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-06 Conflicts</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-approval" className="text-xs text-[#d4af37] hover:underline">
          Executive Approval →
        </Link>
        <Link href="/cockpit/founder/conflict-resolution" className="text-xs text-[#d4af37] hover:underline">
          Conflict panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeConflictCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical / High</p>
          <p className="text-sm text-rose-300">{view.criticalConflictCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Escalations</p>
          <p className="text-sm text-[#e8e0d0]">{view.escalationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Conflict Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.conflictHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-06 — Permanent Conflict Resolution Engine panel. */
export function ConflictResolutionEngineDashboard() {
  const { view, loading, error, reload, live, data } = useConflictResolutionEngine();

  if (loading && !view) {
    return <Panel title="Conflict Resolution">Loading conflict resolution engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Conflict Resolution" subtitle="E2-06 · Conflict Resolution Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-rose-500/40 bg-gradient-to-br from-rose-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-06 Conflict Resolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE207 && <Badge variant="gold">E2-07 Active</Badge>}
          <Link href="/cockpit/founder/executive-approval" className="text-xs text-[#d4af37] hover:underline">
            Executive Approval →
          </Link>
          <Link href="/cockpit/founder/resource-allocation" className="text-xs text-[#d4af37] hover:underline">
            Resource Allocation →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Conflicts" value={String(view.activeConflictCount)} />
        <StatCard label="Escalations" value={String(view.escalationCount)} />
        <StatCard label="Conflict Health" value={view.conflictHealth} />
      </div>

      <Panel title="Active Conflicts">
        <DataTable
          columns={[
            { key: "title", header: "Conflict" },
            { key: "conflictType", header: "Type" },
            { key: "severity", header: "Severity" },
            { key: "businessImpact", header: "Business" },
            { key: "recommendedResolution", header: "Resolution" },
            { key: "resolutionStatus", header: "Status" },
            { key: "escalated", header: "Escalated" },
          ]}
          rows={view.activeConflicts.map((c) => ({
            ...c,
            conflictType: c.conflictType.replace(/_/g, " "),
            escalated: c.escalated ? "yes" : "—",
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Resolution Status">
          <DataTable
            columns={[
              { key: "title", header: "Conflict" },
              { key: "resolutionStrategy", header: "Strategy" },
              { key: "status", header: "Status" },
              { key: "progress", header: "Progress %" },
            ]}
            rows={view.resolutionStatus.map((r) => ({
              ...r,
              resolutionStrategy: r.resolutionStrategy.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Escalations">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "title", header: "Conflict" },
              { key: "severity", header: "Severity" },
              { key: "reason", header: "Reason" },
              { key: "owner", header: "Owner" },
            ]}
            rows={view.escalations}
          />
        </Panel>
      </div>

      <Panel title="Conflict Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Dimension" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
          ]}
          rows={view.conflictAnalysis}
        />
      </Panel>

      <Panel title="Recommendations">
        <DataTable
          columns={[
            { key: "title", header: "Recommendation" },
            { key: "category", header: "Category" },
            { key: "why", header: "Why" },
            { key: "confidencePercent", header: "Confidence %" },
          ]}
          rows={view.recommendedActions}
        />
      </Panel>

      <Panel title="Conflict Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.conflictPipeline}
        />
      </Panel>

      <Panel title="Pillow Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
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
