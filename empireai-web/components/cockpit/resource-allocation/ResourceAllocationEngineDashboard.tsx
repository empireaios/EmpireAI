"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useResourceAllocationEngine } from "@/lib/resource-allocation-engine/useResourceAllocationEngine";

/** Compact Resource Allocation Engine strip for Executive Home. */
export function ResourceAllocationEngineStrip() {
  const { view, loading, live } = useResourceAllocationEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Resource Allocation Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/30 bg-gradient-to-r from-sky-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-05 Resources</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/conflict-resolution" className="text-xs text-[#d4af37] hover:underline">
          Conflict Resolution →
        </Link>
        <Link href="/cockpit/founder/resource-allocation" className="text-xs text-[#d4af37] hover:underline">
          Allocation panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Allocations</p>
          <p className="text-sm text-[#d4af37]">{view.activeAllocationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Utilization</p>
          <p className="text-sm text-sky-300">{view.utilizationSummary}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Bottlenecks</p>
          <p className="text-sm text-[#e8e0d0]">{view.bottleneckCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Resource Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.resourceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-05 — Permanent Resource Allocation Engine panel. */
export function ResourceAllocationEngineDashboard() {
  const { view, loading, error, reload, live, data } = useResourceAllocationEngine();

  if (loading && !view) {
    return <Panel title="Resource Allocation">Loading resource allocation engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Resource Allocation" subtitle="E2-05 · Resource Allocation Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/40 bg-gradient-to-br from-sky-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-05 Resource Allocation</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE206 && <Badge variant="gold">E2-06 Active</Badge>}
          <Link href="/cockpit/founder/conflict-resolution" className="text-xs text-[#d4af37] hover:underline">
            Conflict Resolution →
          </Link>
          <Link href="/cockpit/founder/executive-recommendations" className="text-xs text-[#d4af37] hover:underline">
            Executive Recommendations →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Engine Health" value={view.engineHealth} />
        <StatCard label="Active Allocations" value={String(view.activeAllocationCount)} />
        <StatCard label="Utilization" value={view.utilizationSummary} />
        <StatCard label="Resource Health" value={view.resourceHealth} />
      </div>

      <Panel title="Current Allocations">
        <DataTable
          columns={[
            { key: "purpose", header: "Purpose" },
            { key: "resourceType", header: "Type" },
            { key: "approvedAllocation", header: "Approved" },
            { key: "businessValue", header: "Business" },
            { key: "expectedRoi", header: "ROI" },
            { key: "utilization", header: "Util %" },
            { key: "status", header: "Status" },
          ]}
          rows={view.currentAllocations.map((r) => ({
            ...r,
            resourceType: r.resourceType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Capacity">
          <DataTable
            columns={[
              { key: "label", header: "Domain" },
              { key: "allocated", header: "Allocated" },
              { key: "utilization", header: "Util %" },
              { key: "status", header: "Status" },
            ]}
            rows={view.capacityMetrics}
          />
        </Panel>

        <Panel title="Allocation Optimization">
          <DataTable
            columns={[
              { key: "label", header: "Dimension" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
            ]}
            rows={view.allocationOptimization}
          />
        </Panel>
      </div>

      <Panel title="Current Bottlenecks">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Bottleneck" },
            { key: "severity", header: "Severity" },
            { key: "impact", header: "Impact" },
            { key: "mitigation", header: "Mitigation" },
          ]}
          rows={view.currentBottlenecks}
        />
      </Panel>

      <Panel title="Resource Balancing">
        <DataTable
          columns={[
            { key: "label", header: "Metric" },
            { key: "value", header: "Value" },
            { key: "status", header: "Status" },
          ]}
          rows={view.resourceBalancing}
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

      <Panel title="Resource Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.resourcePipeline}
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
