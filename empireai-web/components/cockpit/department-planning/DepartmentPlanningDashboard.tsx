"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useDepartmentPlanningEngine } from "@/lib/department-planning-engine/useDepartmentPlanningEngine";

/** Compact Department Planning strip for Executive Home. */
export function DepartmentPlanningStrip() {
  const { view, loading, live } = useDepartmentPlanningEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Department Planning…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E1-07 Departments</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/department-planning" className="text-xs text-[#d4af37] hover:underline">
          Department panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Planning Health</p>
          <p className="text-sm text-[#d4af37]">{view.planningHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Active Departments</p>
          <p className="text-sm text-[#e8e0d0]">{view.activeDepartmentCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0] line-clamp-1">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Departments</p>
          <p className="text-sm text-[#e8e0d0]">{view.departments.length}</p>
        </div>
      </div>
    </section>
  );
}

/** E1-07 — Permanent Department Planning Engine panel. */
export function DepartmentPlanningDashboard() {
  const { view, loading, error, reload, live, data } = useDepartmentPlanningEngine();

  if (loading && !view) {
    return <Panel title="Department Planning">Loading department engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Department Planning" subtitle="E1-07 · Department Planning Engine">
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
          <Badge variant="gold">E1-07 Department Planning</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE108 && <Badge variant="gold">Ready for E1-08</Badge>}
          <Link href="/cockpit/founder/executive-calendar" className="text-xs text-[#d4af37] hover:underline">
            Executive Calendar →
          </Link>
          <Link href="/cockpit/founder/initiative-portfolio" className="text-xs text-[#d4af37] hover:underline">
            Initiative Portfolio →
          </Link>
          <Link href="/cockpit/founder/priority-management" className="text-xs text-[#d4af37] hover:underline">
            Priority Management →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.planningSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Planning Health" value={view.planningHealth} />
        <StatCard label="Active Departments" value={String(view.activeDepartmentCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Departments">
        <DataTable
          columns={[
            { key: "departmentName", header: "Department" },
            { key: "owner", header: "Owner" },
            { key: "capacity", header: "Capacity" },
            { key: "healthScore", header: "Health" },
            { key: "performance", header: "Performance" },
            { key: "businessValue", header: "Business Value" },
            { key: "currentStatus", header: "Status" },
          ]}
          rows={view.departments}
        />
      </Panel>

      <Panel title="Department Objectives & Initiatives">
        {view.departments.map((dept) => (
          <div key={dept.departmentId} className="mb-3 rounded border border-gold/10 px-3 py-2 text-sm">
            <p className="font-medium text-[#f0d78c]">{dept.departmentName}</p>
            <p className="mt-1 text-xs text-[#8a847a]">
              Objectives: {dept.currentObjectives.join(" · ")}
            </p>
            <p className="text-xs text-[#8a847a]">
              Initiatives: {dept.assignedInitiatives.join(" · ")}
            </p>
          </div>
        ))}
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Cross-Department Coordination">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "value", header: "Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.crossDepartmentCoordination}
          />
        </Panel>

        <Panel title="Department Planning">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "value", header: "Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.departmentPlanning}
          />
        </Panel>
      </div>

      <Panel title="Dependencies & Risks">
        {view.departments.filter((d) => d.dependencies.length > 0 || d.risks.length > 0).map((dept) => (
          <div key={dept.departmentId} className="mb-3 rounded border border-gold/10 px-3 py-2 text-sm">
            <p className="font-medium text-[#f0d78c]">{dept.departmentName}</p>
            <p className="mt-1 text-xs text-[#8a847a]">
              Dependencies: {dept.dependencies.length ? dept.dependencies.join(", ") : "None"}
            </p>
            <p className="text-xs text-[#8a847a]">
              Risks: {dept.risks.length ? dept.risks.join(", ") : "None"}
            </p>
          </div>
        ))}
      </Panel>

      <Panel title="Department Hierarchy">
        <DataTable
          columns={[
            { key: "label", header: "Layer" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.departmentHierarchy}
        />
      </Panel>

      <Panel title="Department Lifecycle">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {view.departmentLifecycle.map((step) => (
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

      <Panel title="Pillow Department Evaluations">
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
