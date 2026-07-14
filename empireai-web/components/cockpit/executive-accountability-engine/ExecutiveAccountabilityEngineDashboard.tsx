"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveAccountabilityEngine } from "@/lib/executive-accountability-engine/useExecutiveAccountabilityEngine";

/** Compact Executive Accountability Engine strip for Executive Home. */
export function ExecutiveAccountabilityEngineStrip() {
  const { view, loading, live } = useExecutiveAccountabilityEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Accountability Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-06 Accountability</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-accountability" className="text-xs text-[#d4af37] hover:underline">
          Accountability panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Ownership Coverage</p>
          <p className="text-sm text-[#d4af37]">{view.ownershipCoverageScore}%</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Records</p>
          <p className="text-sm text-amber-300">{view.accountabilityRecordCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Ownerless</p>
          <p className="text-sm text-[#e8e0d0]">{view.ownerlessActionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Governance Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.governanceHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-06 — Permanent Executive Accountability Engine panel. */
export function ExecutiveAccountabilityEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveAccountabilityEngine();

  if (loading && !view) {
    return <Panel title="Executive Accountability Engine">Loading executive accountability engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Accountability Engine" subtitle="E5-06 · Executive Accountability">
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
          <Badge variant="gold">E5-06 Executive Accountability Engine</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE507 && (
            <Link href="/cockpit/founder/executive-transparency">
              <Badge variant="gold">E5-07 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-ethics" className="text-xs text-[#d4af37] hover:underline">
            E5-05 Ethics →
          </Link>
          <Link href="/cockpit/founder/executive-compliance" className="text-xs text-[#d4af37] hover:underline">
            E5-04 Compliance →
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
        <StatCard label="Governance Health" value={view.governanceHealth} />
        <StatCard label="Ownership Coverage" value={`${view.ownershipCoverageScore}%`} />
        <StatCard label="Accountability Records" value={String(view.accountabilityRecordCount)} />
        <StatCard label="Ownerless Actions" value={String(view.ownerlessActionCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Fully Accountable" value={String(view.fullyAccountableCount)} />
        <StatCard label="Traceability Records" value={String(view.decisionTraceability.length)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Executive Ownership">
        <DataTable
          columns={[
            { key: "executiveAction", header: "Executive Action" },
            { key: "owner", header: "Owner" },
            { key: "authorityLevel", header: "Authority" },
            { key: "currentStatus", header: "Status" },
          ]}
          rows={view.executiveOwnership}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Decision Traceability">
          <DataTable
            columns={[
              { key: "executiveAction", header: "Decision" },
              { key: "decisionMaker", header: "Decision Maker" },
              { key: "authorityUsed", header: "Authority" },
              { key: "traceStatus", header: "Status" },
            ]}
            rows={view.decisionTraceability}
          />
        </Panel>

        <Panel title="Authority Chain">
          <DataTable
            columns={[
              { key: "role", header: "Role" },
              { key: "authority", header: "Authority" },
              { key: "delegatedFrom", header: "Delegated From" },
              { key: "validationStatus", header: "Status" },
            ]}
            rows={view.authorityChain}
          />
        </Panel>
      </div>

      <Panel title="Responsibility Matrix">
        <DataTable
          columns={[
            { key: "domain", header: "Domain" },
            { key: "owner", header: "Owner" },
            { key: "responsibility", header: "Responsibility" },
            { key: "status", header: "Status" },
          ]}
          rows={view.responsibilityMatrix}
        />
      </Panel>

      <Panel title="Accountability Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.accountabilityAnalysis}
        />
      </Panel>

      <Panel title="Executive Accountability Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "Step" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.executiveAccountabilityPipeline}
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

      <Panel title="Pillow Accountability Evaluations">
        <DataTable
          columns={[
            { key: "label", header: "Evaluation" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.pillowEvaluations}
        />
      </Panel>
    </div>
  );
}
