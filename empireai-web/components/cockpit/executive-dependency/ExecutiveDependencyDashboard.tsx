"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveDependencyEngine } from "@/lib/executive-dependency-engine/useExecutiveDependencyEngine";

/** Compact Executive Dependency strip for Executive Home. */
export function ExecutiveDependencyStrip() {
  const { view, loading, live } = useExecutiveDependencyEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Dependencies…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-09 Dependencies</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-dependencies" className="text-xs text-[#d4af37] hover:underline">
          Dependency panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Dependency Health</p>
          <p className="text-sm text-[#d4af37]">{view.dependencyHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Execution Readiness</p>
          <p className="text-sm text-[#e8e0d0]">{view.executionReadiness}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Path</p>
          <p className="text-sm text-[#e8e0d0]">{view.criticalPath.length}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Blocking</p>
          <p className="text-sm text-[#e8e0d0]">{view.blockingDependencyCount}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-09 — Permanent Executive Dependency Engine panel. */
export function ExecutiveDependencyDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveDependencyEngine();

  if (loading && !view) {
    return <Panel title="Executive Dependencies">Loading dependency engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Dependencies" subtitle="E1-09 · Executive Dependency Engine">
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
          <Badge variant="gold">E1-09 Executive Dependencies</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE110 && <Badge variant="gold">Ready for E1-10</Badge>}
          <Link href="/cockpit/founder/executive-scenarios" className="text-xs text-[#d4af37] hover:underline">
            Executive Scenarios →
          </Link>
          <Link href="/cockpit/founder/executive-calendar" className="text-xs text-[#d4af37] hover:underline">
            Executive Calendar →
          </Link>
          <Link href="/cockpit/founder/executive-roadmap" className="text-xs text-[#d4af37] hover:underline">
            Executive Roadmap →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.dependencySummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Dependency Health" value={view.dependencyHealth} />
        <StatCard label="Execution Readiness" value={view.executionReadiness} />
        <StatCard label="Critical Dependencies" value={String(view.criticalDependencyCount)} />
        <StatCard label="Blocking Dependencies" value={String(view.blockingDependencyCount)} />
      </div>

      <Panel title="Critical Path">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Dependency" },
            { key: "parent", header: "Parent" },
            { key: "child", header: "Child" },
            { key: "status", header: "Status" },
            { key: "blockingStatus", header: "Blocking" },
          ]}
          rows={view.criticalPath}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Current Bottlenecks">
          <DataTable
            columns={[
              { key: "label", header: "Type" },
              { key: "title", header: "Bottleneck" },
              { key: "severity", header: "Severity" },
              { key: "owner", header: "Owner" },
              { key: "resolution", header: "Resolution" },
            ]}
            rows={view.currentBottlenecks}
          />
        </Panel>

        <Panel title="Blocking Dependencies">
          <DataTable
            columns={[
              { key: "title", header: "Dependency" },
              { key: "criticality", header: "Criticality" },
              { key: "riskLevel", header: "Risk" },
              { key: "blockingStatus", header: "Status" },
              { key: "expectedResolution", header: "Resolution" },
            ]}
            rows={view.blockingDependencies}
          />
        </Panel>
      </div>

      <Panel title="Cross-Department Dependencies">
        <DataTable
          columns={[
            { key: "title", header: "Dependency" },
            { key: "parent", header: "Parent" },
            { key: "child", header: "Child" },
            { key: "owner", header: "Owner" },
            { key: "currentStatus", header: "Status" },
          ]}
          rows={view.crossDepartmentDependencies}
        />
      </Panel>

      <Panel title="Dependency Graph">
        <DataTable
          columns={[
            { key: "label", header: "Node" },
            { key: "type", header: "Type" },
            { key: "connections", header: "Connections" },
            { key: "status", header: "Status" },
          ]}
          rows={view.dependencyGraph}
        />
      </Panel>

      <Panel title="Dependency Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
          ]}
          rows={view.dependencyAnalysis}
        />
      </Panel>

      <Panel title="All Dependencies">
        <DataTable
          columns={[
            { key: "title", header: "Dependency" },
            { key: "dependencyType", header: "Type" },
            { key: "classification", header: "Class" },
            { key: "criticality", header: "Criticality" },
            { key: "blockingStatus", header: "Blocking" },
            { key: "owner", header: "Owner" },
          ]}
          rows={view.allDependencies}
        />
      </Panel>

      <Panel title="Dependency Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.dependencyHierarchy}
        />
      </Panel>

      <Panel title="Dependency Lifecycle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.dependencyLifecycle.map((step) => (
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

      <Panel title="Pillow Dependency Evaluations">
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
