"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveArchitectureFramework } from "@/lib/executive-architecture-framework/useExecutiveArchitectureFramework";

/** Compact Executive Architecture strip for Executive Home — capstone of E1. */
export function ExecutiveArchitectureStrip() {
  const { view, loading, live } = useExecutiveArchitectureFramework();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Architecture…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/30 bg-gradient-to-r from-gold/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-01 Executive</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {view.constitutionalFoundationComplete && (
            <Badge variant="gold">P1–P9 Foundation</Badge>
          )}
        </div>
        <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
          Executive Planning →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Executive Health</p>
          <p className="text-sm text-[#d4af37]">{view.executiveHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Strategic Direction</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.strategicDirection}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Planning Status</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.planningStatus}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Objectives</p>
          <p className="text-sm text-[#e8e0d0]">{view.currentObjectives.length} active</p>
        </div>
      </div>
    </section>
  );
}

/** E1-01 — Permanent Executive Architecture Framework panel. */
export function ExecutiveArchitectureDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveArchitectureFramework();

  if (loading && !view) {
    return <Panel title="Executive Planning">Loading executive architecture…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Planning" subtitle="E1-01 · Executive Architecture Framework">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/30 bg-gradient-to-br from-gold/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E1-01 Executive Architecture</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.constitutionalFoundationComplete && (
            <Badge variant="gold">Constitutional Foundation P1–P9 Complete</Badge>
          )}
          {view.readyForE102 && <Badge variant="gold">Ready for E1-02</Badge>}
          <Link href="/cockpit/founder/empire-evolution" className="text-xs text-[#d4af37] hover:underline">
            Empire Evolution →
          </Link>
          <Link href="/cockpit/founder/grand-king" className="text-xs text-[#d4af37] hover:underline">
            Grand King →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.executiveSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Executive Health" value={view.executiveHealth} />
        <StatCard label="Strategic Direction" value={view.strategicDirection} />
        <StatCard label="Planning Status" value={view.planningStatus} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Constitution" value={view.constitutionStatus} />
        <StatCard label="Objectives" value={String(view.currentObjectives.length)} />
        <StatCard label="Priorities" value={String(view.currentPriorities.length)} />
        <StatCard label="Initiatives" value={String(view.currentInitiatives.length)} />
      </div>

      <Panel title="Current Objectives">
        <DataTable
          columns={[
            { key: "title", header: "Objective" },
            { key: "status", header: "Status" },
            { key: "alignment", header: "Alignment" },
          ]}
          rows={view.currentObjectives}
        />
      </Panel>

      <Panel title="Current Priorities">
        <DataTable
          columns={[
            { key: "rank", header: "Rank" },
            { key: "title", header: "Priority" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentPriorities}
        />
      </Panel>

      <Panel title="Current Initiatives">
        <DataTable
          columns={[
            { key: "title", header: "Initiative" },
            { key: "phase", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentInitiatives}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Executive Risks">
          <div className="grid gap-3">
            {view.executiveRisks.map((risk) => (
              <div key={risk.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <StatusBadge status={risk.severity} />
                </div>
                <h4 className="mt-2 font-medium text-[#f0d78c]">{risk.title}</h4>
                <p className="mt-1 text-xs text-[#8a847a]">{risk.mitigation}</p>
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Executive Opportunities">
          <div className="grid gap-3">
            {view.executiveOpportunities.map((opp) => (
              <div key={opp.id} className="rounded-lg border border-gold/10 bg-white/[0.02] p-4">
                <div className="flex items-center gap-2">
                  <Badge variant="gold">{opp.impact}</Badge>
                  <span className="text-xs text-[#6f6a60]">{opp.confidencePercent}%</span>
                </div>
                <h4 className="mt-2 font-medium text-[#f0d78c]">{opp.title}</h4>
              </div>
            ))}
          </div>
        </Panel>
      </div>

      <Panel title="Executive Planning Pipeline">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.planningPipeline.map((step) => (
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

      <Panel title="Executive Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "owner", header: "Owner" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.executiveLayers}
        />
      </Panel>

      <Panel title="Executive Ownership">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {view.executiveOwnership.map((entry) => (
            <div key={entry.role} className="rounded-lg border border-gold/10 px-4 py-3">
              <h4 className="font-medium text-[#f0d78c]">{entry.label}</h4>
              <ul className="mt-2 space-y-1 text-xs text-[#8a847a]">
                {entry.responsibilities.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Executive Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>

      <Panel title="Executive Recommendations">
        <div className="grid gap-3 lg:grid-cols-2">
          {view.executiveRecommendations.map((rec) => (
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
