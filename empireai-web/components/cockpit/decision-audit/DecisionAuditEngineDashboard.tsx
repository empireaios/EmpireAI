"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useDecisionAuditEngine } from "@/lib/decision-audit-engine/useDecisionAuditEngine";

/** Compact Decision Audit Engine strip for Executive Home. */
export function DecisionAuditEngineStrip() {
  const { view, loading, live } = useDecisionAuditEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Decision Audit Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-indigo-500/40 bg-gradient-to-r from-indigo-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-13 Audit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/decision-audit" className="text-xs text-[#d4af37] hover:underline">
          Audit panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Audited</p>
          <p className="text-sm text-[#d4af37]">{view.auditedDecisionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Verified</p>
          <p className="text-sm text-indigo-300">{view.verifiedAuditCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Audit Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.auditHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-13 — Permanent Decision Audit Engine panel. */
export function DecisionAuditEngineDashboard() {
  const { view, loading, error, reload, live, data } = useDecisionAuditEngine();

  if (loading && !view) {
    return <Panel title="Decision Audit">Loading decision audit engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Decision Audit" subtitle="E2-13 · Decision Audit Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-indigo-500/50 bg-gradient-to-br from-indigo-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-13 Decision Audit</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE214 && (
            <Link href="/cockpit/founder/executive-confidence">
              <Badge variant="gold">E2-14 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
            Executive Policies →
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
        <StatCard label="Audited Decisions" value={String(view.auditedDecisionCount)} />
        <StatCard label="Verified Audits" value={String(view.verifiedAuditCount)} />
        <StatCard label="Pending Audits" value={String(view.pendingAuditCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <StatCard label="Audit Health" value={view.auditHealth} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <Panel title="Recent Decisions">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "decisionType", header: "Type" },
            { key: "businessImpact", header: "Business" },
            { key: "outcome", header: "Outcome" },
            { key: "owner", header: "Owner" },
            { key: "confidence", header: "Confidence" },
            { key: "auditStatus", header: "Audit Status" },
          ]}
          rows={view.recentDecisions.map((d) => ({
            ...d,
            decisionType: d.decisionType.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <Panel title="Decision Timeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "title", header: "Decision" },
            { key: "phase", header: "Phase" },
            { key: "event", header: "Event" },
            { key: "timestamp", header: "Timestamp" },
            { key: "status", header: "Status" },
          ]}
          rows={view.decisionTimeline.slice(0, 18)}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Evidence">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "evidence", header: "Evidence" },
              { key: "source", header: "Source" },
              { key: "verified", header: "Verified" },
            ]}
            rows={view.auditEvidence.slice(0, 12).map((e) => ({
              ...e,
              verified: e.verified ? "Yes" : "No",
            }))}
          />
        </Panel>

        <Panel title="Approvals">
          <DataTable
            columns={[
              { key: "title", header: "Decision" },
              { key: "approver", header: "Approver" },
              { key: "authority", header: "Authority" },
              { key: "status", header: "Status" },
            ]}
            rows={view.approvalHistory.slice(0, 12).map((a) => ({
              ...a,
              authority: a.authority.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Execution History">
        <DataTable
          columns={[
            { key: "title", header: "Decision" },
            { key: "action", header: "Action" },
            { key: "executor", header: "Executor" },
            { key: "status", header: "Status" },
            { key: "timestamp", header: "Timestamp" },
          ]}
          rows={view.executionHistory.slice(0, 12)}
        />
      </Panel>

      <Panel title="Audit Verification">
        <DataTable
          columns={[
            { key: "label", header: "Capability" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.auditVerification}
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

      <Panel title="Audit Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.auditPipeline}
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

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Audit Principles">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.auditPrinciples.map((principle) => (
              <li key={principle}>
                <span className="text-[#d4af37]">•</span> {principle.replace(/_/g, " ")}
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Governed Audit Domains">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
            ]}
            rows={view.governedDomains.map((domain) => ({
              domain: domain.replace(/_/g, " "),
            }))}
          />
        </Panel>
      </div>

      <Panel title="Pillow Advisory">
        <ul className="space-y-2 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}
