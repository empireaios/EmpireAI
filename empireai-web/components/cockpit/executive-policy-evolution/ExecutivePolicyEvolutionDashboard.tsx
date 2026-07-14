"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutivePolicyEvolution } from "@/lib/executive-policy-evolution/useExecutivePolicyEvolution";

/** Compact Executive Policy Evolution strip for Executive Home. */
export function ExecutivePolicyEvolutionStrip() {
  const { view, loading, live } = useExecutivePolicyEvolution();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading Executive Policy Evolution…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E5-11 Policy Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
        </div>
        <Link href="/cockpit/founder/executive-policy-evolution" className="text-xs text-[#d4af37] hover:underline">
          Evolution panel →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Total Evolutions</p>
          <p className="text-sm text-[#d4af37]">{view.totalEvolutionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Pending</p>
          <p className="text-sm text-emerald-300">{view.pendingEvolutionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Published</p>
          <p className="text-sm text-[#e8e0d0]">{view.publishedEvolutionCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Evolution Health</p>
          <p className="text-sm text-[#e8e0d0]">{view.evolutionHealth}</p>
        </div>
      </div>
    </section>
  );
}

/** E5-11 — Permanent Executive Policy Evolution panel. */
export function ExecutivePolicyEvolutionDashboard() {
  const { view, loading, error, reload, live, data } = useExecutivePolicyEvolution();

  if (loading && !view) {
    return <Panel title="Executive Policy Evolution">Loading executive policy evolution…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Policy Evolution" subtitle="E5-11 · Policy Evolution">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E5-11 Executive Policy Evolution</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.healthScore >= 85 ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.readyForE512 && (
            <Link href="/cockpit/founder/executive-trust-engine" className="text-xs text-[#d4af37] hover:underline">
              Ready for E5-12 →
            </Link>
          )}
          <Link href="/cockpit/founder/executive-review-board" className="text-xs text-[#d4af37] hover:underline">
            E5-10 Review Board →
          </Link>
          <Link href="/cockpit/founder/enterprise-risk-governance" className="text-xs text-[#d4af37] hover:underline">
            E5-09 Risk Governance →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 line-clamp-4 text-sm text-[#c8c0b0]">{view.engineSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Evolution Health" value={view.evolutionHealth} />
        <StatCard label="Total Evolutions" value={String(view.totalEvolutionCount)} />
        <StatCard label="Pending" value={String(view.pendingEvolutionCount)} />
        <StatCard label="Published" value={String(view.publishedEvolutionCount)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Approved" value={String(view.approvedEvolutionCount)} />
        <StatCard label="Regression Risk" value={String(view.regressionRiskCount)} />
        <StatCard label="Vision Alignment" value={view.visionAlignment} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Policy Versions">
          <DataTable
            columns={[
              { key: "policyName", header: "Policy" },
              { key: "version", header: "Version" },
              { key: "domain", header: "Domain" },
              { key: "status", header: "Status" },
            ]}
            rows={view.policyVersions}
          />
        </Panel>

        <Panel title="Evolution Queue">
          <DataTable
            columns={[
              { key: "policyName", header: "Policy" },
              { key: "proposedVersion", header: "Proposed" },
              { key: "approvalStatus", header: "Status" },
              { key: "scheduledDate", header: "Scheduled" },
            ]}
            rows={view.evolutionQueue}
          />
        </Panel>
      </div>

      <Panel title="Improvement Opportunities">
        <DataTable
          columns={[
            { key: "policyName", header: "Policy" },
            { key: "opportunity", header: "Opportunity" },
            { key: "confidence", header: "Confidence" },
            { key: "status", header: "Status" },
          ]}
          rows={view.improvementOpportunities}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Policy Effectiveness">
          <DataTable
            columns={[
              { key: "policyName", header: "Policy" },
              { key: "effectivenessScore", header: "Effectiveness" },
              { key: "complianceRate", header: "Compliance" },
              { key: "adoptionRate", header: "Adoption" },
            ]}
            rows={view.policyEffectiveness}
          />
        </Panel>

        <Panel title="Governance Stability">
          <DataTable
            columns={[
              { key: "domain", header: "Domain" },
              { key: "score", header: "Score" },
              { key: "status", header: "Status" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.governanceStability}
          />
        </Panel>
      </div>

      <Panel title="Policy Evolution Register">
        <DataTable
          columns={[
            { key: "policyName", header: "Policy" },
            { key: "currentVersion", header: "Current" },
            { key: "proposedVersion", header: "Proposed" },
            { key: "approvalStatus", header: "Status" },
            { key: "confidence", header: "Confidence" },
          ]}
          rows={view.policyEvolutionRegister}
        />
      </Panel>

      <Panel title="Policy Evolution Analysis">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.policyEvolutionAnalysis}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Policy Evolution Pipeline">
          <DataTable
            columns={[
              { key: "label", header: "Phase" },
              { key: "order", header: "Order" },
              { key: "status", header: "Status" },
            ]}
            rows={view.policyEvolutionPipeline}
          />
        </Panel>

        <Panel title="Background Monitoring">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p>Status: {view.monitoringStatus.backgroundMonitoring}</p>
            <p>Pending evolutions: {view.monitoringStatus.pendingEvolutionCount}</p>
            <p>Published evolutions: {view.monitoringStatus.publishedEvolutionCount}</p>
            <p>Policy stability: {view.monitoringStatus.policyStabilityScore}/100</p>
            <p>Last scan: {new Date(view.monitoringStatus.lastScanAt).toLocaleString()}</p>
          </div>
        </Panel>
      </div>

      <Panel title="Executive Recommendations">
        <div className="space-y-4">
          {view.recommendedActions.map((rec) => (
            <div key={rec.id} className="rounded-lg border border-gold/20 px-4 py-3">
              <p className="font-medium text-[#d4af37]">{rec.title}</p>
              <p className="mt-1 text-sm text-[#c8c0b0]">{rec.why}</p>
              <p className="mt-1 text-xs text-[#8a847a]">
                {rec.what} · Confidence {rec.confidencePercent}%
              </p>
            </div>
          ))}
        </div>
      </Panel>

      <Panel title="Pillow Advisory">
        <ul className="list-inside list-disc space-y-1 text-sm text-[#c8c0b0]">
          {view.pillowAdvisory.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </Panel>

      <Panel title="E5 Integration Status">
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {Object.entries(view.integrations).map(([key, value]) => (
            <div key={key} className="rounded border border-gold/10 px-3 py-2 text-xs">
              <p className="text-[#6f6a60]">{key}</p>
              <p className="text-[#e8e0d0]">{value}</p>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
