"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { usePriorityManagementEngine } from "@/lib/priority-management-engine/usePriorityManagementEngine";

/** Compact Priority Management strip for Executive Home. */
export function PriorityManagementStrip() {
  const { view, loading, live } = usePriorityManagementEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Priority Management…
      </section>
    );
  }

  if (!view) return null;

  const top = view.currentPriorities[0];

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-05 Priorities</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/priority-management" className="text-xs text-[#d4af37] hover:underline">
          Priority panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Priority Health</p>
          <p className="text-sm text-[#d4af37]">{view.priorityHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Top Score</p>
          <p className="text-sm text-[#e8e0d0]">{view.topPriorityScore}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Priorities</p>
          <p className="text-sm text-[#e8e0d0]">{view.activePriorityCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Focus First</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{top?.title ?? "—"}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-05 — Permanent Priority Management Engine panel. */
export function PriorityManagementDashboard() {
  const { view, loading, error, reload, live, data } = usePriorityManagementEngine();

  if (loading && !view) {
    return <Panel title="Priority Management">Loading priority engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Priority Management" subtitle="E1-05 · Priority Management Engine">
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
          <Badge variant="gold">E1-05 Priority Management</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE106 && <Badge variant="gold">Ready for E1-06</Badge>}
          <Link href="/cockpit/founder/initiative-portfolio" className="text-xs text-[#d4af37] hover:underline">
            Initiative Portfolio →
          </Link>
          <Link href="/cockpit/founder/executive-roadmap" className="text-xs text-[#d4af37] hover:underline">
            Executive Roadmap →
          </Link>
          <Link href="/cockpit/founder/strategic-objectives" className="text-xs text-[#d4af37] hover:underline">
            Strategic Objectives →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.prioritySummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Priority Health" value={view.priorityHealth} />
        <StatCard label="Top Priority Score" value={String(view.topPriorityScore)} />
        <StatCard label="Active Priorities" value={String(view.activePriorityCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Current Priorities">
        <DataTable
          columns={[
            { key: "recommendedOrder", header: "#" },
            { key: "title", header: "Priority" },
            { key: "currentScore", header: "Score" },
            { key: "level", header: "Level" },
            { key: "urgency", header: "Urgency" },
            { key: "businessImpact", header: "Business" },
            { key: "strategicImpact", header: "Strategic" },
            { key: "riskLevel", header: "Risk" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.currentPriorities}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Execution Queue">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "title", header: "Work Item" },
              { key: "level", header: "Level" },
              { key: "score", header: "Score" },
              { key: "owner", header: "Owner" },
              { key: "eta", header: "ETA" },
            ]}
            rows={view.executionQueue}
          />
        </Panel>

        <Panel title="Priority Changes">
          <DataTable
            columns={[
              { key: "title", header: "Priority" },
              { key: "previousOrder", header: "Was" },
              { key: "newOrder", header: "Now" },
              { key: "trigger", header: "Trigger" },
              { key: "reason", header: "Reason" },
            ]}
            rows={view.priorityChanges}
          />
        </Panel>
      </div>

      <Panel title="Impact & Dependencies">
        {view.currentPriorities.slice(0, 6).map((p) => (
          <div key={p.priorityId} className="mb-3 rounded border border-gold/10 px-3 py-2 text-sm">
            <p className="font-medium text-[#f0d78c]">
              #{p.recommendedOrder} {p.title} · Score {p.currentScore}
            </p>
            <p className="mt-1 text-xs text-[#8a847a]">
              Business {p.businessImpact} · Engineering {p.engineeringImpact} · Commercial {p.commercialImpact} ·
              Financial {p.financialImpact}
            </p>
            <p className="text-xs text-[#8a847a]">
              Dependencies: {p.dependencies.length ? p.dependencies.join(", ") : "None"}
            </p>
          </div>
        ))}
      </Panel>

      {view.currentPriorities[0] && (
        <Panel title={`Priority Scoring — ${view.currentPriorities[0].title}`}>
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "weight", header: "Weight" },
              { key: "weightedScore", header: "Weighted" },
            ]}
            rows={view.currentPriorities[0].scoreBreakdown}
          />
        </Panel>
      )}

      <Panel title="Priority Pipeline">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.priorityPipeline.map((step) => (
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

      <Panel title="Recommended Next Actions">
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

      <Panel title="Pillow Priority Evaluations">
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
