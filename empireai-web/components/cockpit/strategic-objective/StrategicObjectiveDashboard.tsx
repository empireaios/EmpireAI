"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useStrategicObjectiveEngine } from "@/lib/strategic-objective-engine/useStrategicObjectiveEngine";

/** Compact Strategic Objectives strip for Executive Home. */
export function StrategicObjectiveStrip() {
  const { view, loading, live } = useStrategicObjectiveEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Strategic Objectives…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-03 Objectives</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/strategic-objectives" className="text-xs text-[#d4af37] hover:underline">
          Objectives panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Objective Health</p>
          <p className="text-sm text-[#d4af37]">{view.objectiveHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeObjectiveCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Coverage</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.strategicCoverage}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-03 — Permanent Strategic Objective Engine panel. */
export function StrategicObjectiveDashboard() {
  const { view, loading, error, reload, live, data } = useStrategicObjectiveEngine();

  if (loading && !view) {
    return <Panel title="Strategic Objectives">Loading objective engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Strategic Objectives" subtitle="E1-03 · Strategic Objective Engine">
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
          <Badge variant="gold">E1-03 Strategic Objectives</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE104 && (
            <Link href="/cockpit/founder/executive-roadmap" className="text-xs">
              <Badge variant="gold">Executive Roadmap →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/corporate-vision" className="text-xs text-[#d4af37] hover:underline">
            Corporate Vision →
          </Link>
          <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
            Executive Planning →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.objectiveSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Objective Health" value={view.objectiveHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
        <StatCard label="Active Objectives" value={String(view.activeObjectiveCount)} />
        <StatCard label="Strategic Coverage" value={view.strategicCoverage} />
      </div>

      <Panel title="Current Strategic Objectives">
        <DataTable
          columns={[
            { key: "title", header: "Objective" },
            { key: "owner", header: "Owner" },
            { key: "priority", header: "Priority" },
            { key: "completionPercent", header: "Progress" },
            { key: "currentStatus", header: "Status" },
            { key: "confidencePercent", header: "Confidence" },
            { key: "businessImpact", header: "Business Impact" },
          ]}
          rows={view.currentStrategicObjectives}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dependencies & Risks">
          {view.currentStrategicObjectives.map((obj) => (
            <div key={obj.objectiveId} className="mb-3 rounded border border-gold/10 px-3 py-2 text-sm">
              <p className="font-medium text-[#f0d78c]">{obj.title}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                Dependencies: {obj.dependencies.length ? obj.dependencies.join(", ") : "None"}
              </p>
              <p className="text-xs text-[#8a847a]">
                Risks: {obj.risks.length ? obj.risks.join(", ") : "None"}
              </p>
            </div>
          ))}
        </Panel>

        <Panel title="Objective Measurements">
          <DataTable
            columns={[
              { key: "label", header: "Metric" },
              { key: "value", header: "Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.objectiveMeasurements}
          />
        </Panel>
      </div>

      <Panel title="Objective Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.objectiveHierarchy}
        />
      </Panel>

      <Panel title="Objective Lifecycle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.objectiveLifecycle.map((step) => (
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

      <Panel title="Recommended Actions">
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

      <Panel title="Pillow Objective Evaluations">
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
