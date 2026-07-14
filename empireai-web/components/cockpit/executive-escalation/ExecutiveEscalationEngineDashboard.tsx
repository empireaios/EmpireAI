"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveEscalationEngine } from "@/lib/executive-escalation-engine/useExecutiveEscalationEngine";

/** Compact Executive Escalation Engine strip for Executive Home. */
export function ExecutiveEscalationEngineStrip() {
  const { view, loading, live } = useExecutiveEscalationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Escalation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-09 Escalations</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-escalations" className="text-xs text-[#d4af37] hover:underline">
          Escalation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeEscalationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Grand King</p>
          <p className="text-sm text-amber-300">{view.grandKingEscalationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Escalation Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.escalationHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-09 — Permanent Executive Escalation Engine panel. */
export function ExecutiveEscalationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveEscalationEngine();

  if (loading && !view) {
    return <Panel title="Executive Escalations">Loading executive escalation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Escalations" subtitle="E2-09 · Executive Escalation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-amber-500/50 bg-gradient-to-br from-amber-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-09 Executive Escalations</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE210 && <Badge variant="gold">E2-10 Active</Badge>}
          <Link href="/cockpit/founder/trade-off-analysis" className="text-xs text-[#d4af37] hover:underline">
            Trade-off Analysis →
          </Link>
          <Link href="/cockpit/founder/crisis-decisions" className="text-xs text-[#d4af37] hover:underline">
            Crisis Decisions →
          </Link>
          <Link href="/cockpit/founder/executive-approval" className="text-xs text-[#d4af37] hover:underline">
            Executive Approval →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Escalations" value={String(view.activeEscalationCount)} />
        <StatCard label="Grand King Queue" value={String(view.grandKingEscalationCount)} />
        <StatCard label="Escalation Health" value={view.escalationHealth} />
      </div>

      <Panel title="Active Escalations">
        <DataTable
          columns={[
            { key: "title", header: "Escalation" },
            { key: "category", header: "Category" },
            { key: "escalationLevel", header: "Level" },
            { key: "severity", header: "Severity" },
            { key: "businessImpact", header: "Business" },
            { key: "priority", header: "Priority" },
            { key: "resolutionStatus", header: "Status" },
          ]}
          rows={view.activeEscalations.map((e) => ({
            ...e,
            category: e.category.replace(/_/g, " "),
            escalationLevel: e.escalationLevel.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Escalation Queue">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "title", header: "Escalation" },
              { key: "escalationLevel", header: "Level" },
              { key: "priority", header: "Priority" },
              { key: "requiredAuthority", header: "Authority" },
              { key: "status", header: "Status" },
            ]}
            rows={view.escalationQueue.map((e) => ({
              ...e,
              escalationLevel: e.escalationLevel.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Authority Routing">
          <DataTable
            columns={[
              { key: "title", header: "Escalation" },
              { key: "escalationLevel", header: "Level" },
              { key: "requiredAuthority", header: "Authority" },
              { key: "routingReason", header: "Reason" },
              { key: "status", header: "Status" },
            ]}
            rows={view.authorityRouting.map((e) => ({
              ...e,
              escalationLevel: e.escalationLevel.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Resolution Status">
        <DataTable
          columns={[
            { key: "title", header: "Escalation" },
            { key: "escalationLevel", header: "Level" },
            { key: "resolutionProgress", header: "Progress %" },
            { key: "resolutionStatus", header: "Status" },
            { key: "recommendedAction", header: "Action" },
          ]}
          rows={view.resolutionStatus.map((e) => ({
            ...e,
            escalationLevel: e.escalationLevel.replace(/_/g, " "),
          }))}
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

      <Panel title="Escalation Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.escalationPipeline}
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
