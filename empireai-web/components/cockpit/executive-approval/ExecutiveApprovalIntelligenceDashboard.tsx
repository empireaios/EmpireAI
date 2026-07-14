"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveApprovalIntelligence } from "@/lib/executive-approval-intelligence/useExecutiveApprovalIntelligence";

/** Compact Executive Approval Intelligence strip for Executive Home. */
export function ExecutiveApprovalIntelligenceStrip() {
  const { view, loading, live } = useExecutiveApprovalIntelligence();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Approval Intelligence…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-500/[0.12] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-07 Approvals</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/crisis-decisions" className="text-xs text-[#d4af37] hover:underline">
          Crisis Decisions →
        </Link>
        <Link href="/cockpit/founder/executive-approval" className="text-xs text-[#d4af37] hover:underline">
          Approval panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-[#d4af37]">{view.pendingApprovalCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Grand King</p>
          <p className="text-sm text-indigo-300">{view.grandKingApprovalCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Escalations</p>
          <p className="text-sm text-[#e8e0d0]">{view.escalationCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Approval Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.approvalHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-07 — Permanent Executive Approval Intelligence panel. */
export function ExecutiveApprovalIntelligenceDashboard() {
  const { view, loading, error, reload, live, data } = useExecutiveApprovalIntelligence();

  if (loading && !view) {
    return <Panel title="Executive Approval">Loading approval intelligence…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Approval" subtitle="E2-07 · Executive Approval Intelligence">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-500/40 bg-gradient-to-br from-indigo-500/[0.12] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-07 Executive Approval</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE208 && <Badge variant="gold">E2-08 Active</Badge>}
          <Link href="/cockpit/founder/crisis-decisions" className="text-xs text-[#d4af37] hover:underline">
            Crisis Decisions →
          </Link>
          <Link href="/cockpit/founder/conflict-resolution" className="text-xs text-[#d4af37] hover:underline">
            Conflict Resolution →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.intelligenceSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Intelligence Health" value={view.intelligenceHealth} />
        <StatCard label="Pending Approvals" value={String(view.pendingApprovalCount)} />
        <StatCard label="Grand King Queue" value={String(view.grandKingApprovalCount)} />
        <StatCard label="Approval Health" value={view.approvalHealth} />
      </div>

      <Panel title="Approval Queue">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Approval" },
            { key: "approvalType", header: "Type" },
            { key: "recommendedAuthority", header: "Authority" },
            { key: "riskLevel", header: "Risk" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.approvalQueue.map((r) => ({
            ...r,
            approvalType: r.approvalType.replace(/_/g, " "),
            recommendedAuthority: r.recommendedAuthority.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Pending Approvals">
        <DataTable
          columns={[
            { key: "title", header: "Approval" },
            { key: "approvalType", header: "Type" },
            { key: "authorityLevel", header: "Authority" },
            { key: "businessImpact", header: "Business" },
            { key: "financialImpact", header: "Financial" },
            { key: "riskLevel", header: "Risk" },
            { key: "approvalOutcome", header: "Outcome" },
            { key: "escalated", header: "Escalated" },
          ]}
          rows={view.pendingApprovals
            .filter((a) => a.approvalOutcome === "pending" || a.status.includes("pending"))
            .map((r) => ({
              ...r,
              approvalType: r.approvalType.replace(/_/g, " "),
              authorityLevel: r.authorityLevel.replace(/_/g, " "),
              escalated: r.escalated ? "yes" : "—",
            }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Escalations">
          <DataTable
            columns={[
              { key: "order", header: "#" },
              { key: "title", header: "Approval" },
              { key: "trigger", header: "Trigger" },
              { key: "requiredAuthority", header: "Required Authority" },
              { key: "reason", header: "Reason" },
            ]}
            rows={view.escalations.map((r) => ({
              ...r,
              trigger: r.trigger.replace(/_/g, " "),
              requiredAuthority: r.requiredAuthority.replace(/_/g, " "),
            }))}
          />
        </Panel>

        <Panel title="Approval Rules">
          <DataTable
            columns={[
              { key: "label", header: "Rule" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.approvalRules}
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

      <Panel title="Approval Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.approvalPipeline}
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
