"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutivePolicyEngine } from "@/lib/executive-policy-engine/useExecutivePolicyEngine";

/** Compact Executive Policy Engine strip for Executive Home. */
export function ExecutivePolicyEngineStrip() {
  const { view, loading, live } = useExecutivePolicyEngine();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Policy Engine…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-sky-500/40 bg-gradient-to-r from-sky-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E2-12 Policies</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-policies" className="text-xs text-[#d4af37] hover:underline">
          Policy panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Active</p>
          <p className="text-sm text-[#d4af37]">{view.activePolicyCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Compliant</p>
          <p className="text-sm text-sky-300">{view.compliantPolicyCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Policy Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.policyHealth}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Engine Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.engineHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E2-12 — Permanent Executive Policy Engine panel. */
export function ExecutivePolicyEngineDashboard() {
  const { view, loading, error, reload, live, data } = useExecutivePolicyEngine();

  if (loading && !view) {
    return <Panel title="Executive Policies">Loading executive policy engine…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Policies" subtitle="E2-12 · Executive Policy Engine">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-sky-500/50 bg-gradient-to-br from-sky-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E2-12 Executive Policies</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE213 && <Badge variant="gold">E2-13 Active</Badge>}
          <Link href="/cockpit/founder/decision-audit" className="text-xs text-[#d4af37] hover:underline">
            Decision Audit →
          </Link>
          <Link href="/cockpit/founder/executive-consensus" className="text-xs text-[#d4af37] hover:underline">
            Executive Consensus →
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
        <StatCard label="Active Policies" value={String(view.activePolicyCount)} />
        <StatCard label="Compliant" value={String(view.compliantPolicyCount)} />
        <StatCard label="Policy Health" value={view.policyHealth} />
      </div>

      <Panel title="Active Policies">
        <DataTable
          columns={[
            { key: "title", header: "Policy" },
            { key: "category", header: "Category" },
            { key: "priority", header: "Priority" },
            { key: "businessImpact", header: "Business" },
            { key: "strategicImpact", header: "Strategic" },
            { key: "complianceStatus", header: "Compliance" },
            { key: "currentStatus", header: "Status" },
          ]}
          rows={view.activePolicies.map((p) => ({
            ...p,
            category: p.category.replace(/_/g, " "),
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Compliance Status">
          <DataTable
            columns={[
              { key: "title", header: "Policy" },
              { key: "complianceStatus", header: "Status" },
              { key: "complianceScore", header: "Score" },
              { key: "violations", header: "Violations" },
              { key: "lastValidated", header: "Validated" },
            ]}
            rows={view.policyCompliance}
          />
        </Panel>

        <Panel title="Policy Exceptions">
          <DataTable
            columns={[
              { key: "title", header: "Policy" },
              { key: "exception", header: "Exception" },
              { key: "status", header: "Status" },
              { key: "expiresAt", header: "Expires" },
            ]}
            rows={view.policyExceptions}
          />
        </Panel>
      </div>

      <Panel title="Policy Validation">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.policyValidation}
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

      <Panel title="Policy Pipeline">
        <DataTable
          columns={[
            { key: "order", header: "#" },
            { key: "label", header: "Phase" },
            { key: "status", header: "Status" },
          ]}
          rows={view.policyPipeline}
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
