"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveDecisionArchitecture } from "@/lib/executive-decision-architecture/useExecutiveDecisionArchitecture";

/** Compact Executive Decision Architecture strip for Executive Home. */
export function ExecutiveDecisionArchitectureStrip() {
  const { view, loading, live } = useExecutiveDecisionArchitecture();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Decision Architecture…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-gold/40 bg-gradient-to-r from-gold/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-01 Decisions</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
          Risk Assessment →
        </Link>
        <Link href="/cockpit/founder/decision-architecture" className="text-xs text-[#d4af37] hover:underline">
          Decision panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active Decisions</p>
          <p className="text-sm text-[#d4af37]">{view.activeDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-[#e8e0d0]">{view.pendingDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Vision Alignment</p>
          <p className="text-sm text-[#e8e0d0]">{view.visionAlignment}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Architecture Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.architectureHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-01 — Permanent Executive Decision Architecture panel. */
export function ExecutiveDecisionArchitectureDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveDecisionArchitecture();

  if (loading && !view) {
    return <Panel title="Executive Decisions">Loading decision architecture…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Decisions" subtitle="E2-01 · Executive Decision Architecture">
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
          <Badge variant="gold">E2-01 Decision Architecture</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE202 && <Badge variant="gold">E2-02 Active</Badge>}
          <Link href="/cockpit/founder/risk-assessment" className="text-xs text-[#d4af37] hover:underline">
            Risk Assessment →
          </Link>
          <Link href="/cockpit/founder/executive-planning" className="text-xs text-[#d4af37] hover:underline">
            Executive Planning →
          </Link>
          <Link href="/cockpit/founder/executive-planning-certification" className="text-xs text-[#d4af37] hover:underline">
            E1 Certified →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.architectureSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Architecture Health" value={view.architectureHealth} />
        <StatCard label="Active Decisions" value={String(view.activeDecisionCount)} />
        <StatCard label="Pending Decisions" value={String(view.pendingDecisionCount)} />
        <StatCard label="Strategic Alignment" value={view.strategicAlignment} />
      </div>

      <Panel title="Decision Queue">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Decision" },
            { key: "decisionType", header: "Type" },
            { key: "status", header: "Status" },
            { key: "confidence", header: "Confidence" },
            { key: "owner", header: "Owner" },
          ]}
          rows={view.decisionQueue.map((q) => ({
            ...q,
            decisionType: q.decisionType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Current Decisions">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "decisionType", header: "Type" },
            { key: "status", header: "Status" },
            { key: "businessImpact", header: "Business" },
            { key: "riskAssessment", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "decisionOutcome", header: "Outcome" },
          ]}
          rows={view.currentDecisions.map((d) => ({
            ...d,
            decisionType: d.decisionType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Decision Pipeline">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "label", header: "Phase" },
              { key: "status", header: "Status" },
            ]}
            rows={view.decisionPipeline}
          />
        </Panel>

        <Panel title="Decision Governance">
          <DataTable
            columns={[
              { key: "label", header: "Record" },
              { key: "value", header: "Value" },
              { key: "status", header: "Status" },
            ]}
            rows={view.decisionGovernance}
          />
        </Panel>
      </div>

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
