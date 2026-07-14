"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useCrisisDecisionEngine } from "@/lib/crisis-decision-engine/useCrisisDecisionEngine";

/** Compact Crisis Decision Engine strip for Executive Home. */
export function CrisisDecisionEngineStrip() {
  const { view, loading, live } = useCrisisDecisionEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Crisis Decision Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-red-500/40 bg-gradient-to-r from-red-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-08 Crises</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/crisis-decisions" className="text-xs text-[#d4af37] hover:underline">
          Crisis panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activeCrisisCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical / High</p>
          <p className="text-sm text-red-300">{view.criticalCrisisCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Crisis Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.crisisHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-08 — Permanent Crisis Decision Engine panel. */
export function CrisisDecisionEngineDashboard() {
  const { view, loading, error, reload, live, data } = useCrisisDecisionEngine();

  if (loading && !view) {
    return <Panel title="Crisis Decisions">Loading crisis decision engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Crisis Decisions" subtitle="E2-08 · Crisis Decision Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-red-500/50 bg-gradient-to-br from-red-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-08 Crisis Decisions</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE209 && <Badge variant="gold">E2-09 Active</Badge>}
          <Link href="/cockpit/founder/executive-escalations" className="text-xs text-[#d4af37] hover:underline">
            Executive Escalations →
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
        <StatCard label="Active Crises" value={String(view.activeCrisisCount)} />
        <StatCard label="Critical / High" value={String(view.criticalCrisisCount)} />
        <StatCard label="Crisis Health" value={view.crisisHealth} />
      </div>

      <Panel title="Active Crises">
        <DataTable
          columns={[
            { key: "title", header: "Crisis" },
            { key: "category", header: "Category" },
            { key: "severity", header: "Severity" },
            { key: "businessImpact", header: "Business" },
            { key: "riskScore", header: "Risk" },
            { key: "currentStatus", header: "Status" },
            { key: "recoveryProgress", header: "Recovery %" },
          ]}
          rows={view.activeCrises.map((c) => ({
            ...c,
            category: c.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Recovery Progress">
          <DataTable
            columns={[
              { key: "title", header: "Crisis" },
              { key: "severity", header: "Severity" },
              { key: "recoveryProgress", header: "Progress %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.recoveryProgress}
          />
        </Panel>

        <Panel title="Executive Actions">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "title", header: "Crisis" },
              { key: "action", header: "Action" },
              { key: "authority", header: "Authority" },
              { key: "status", header: "Status" },
            ]}
            rows={view.executiveActions}
          />
        </Panel>
      </div>

      <Panel title="Affected Systems & Response">
        <DataTable
          columns={[
            { key: "title", header: "Crisis" },
            { key: "label", header: "Response Domain" },
            { key: "value", header: "Plan" },
            { key: "status", header: "Status" },
          ]}
          rows={view.crisisResponsePlans.slice(0, 14)}
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

      <Panel title="Crisis Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.crisisPipeline}
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
