"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useFinancialExecutiveCertification } from "@/lib/financial-executive-certification/useFinancialExecutiveCertification";

/** Compact E3 Certification strip for Executive Home. */
export function FinancialExecutiveCertificationStrip() {
  const { view, loading, live } = useFinancialExecutiveCertification();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading E3 Certification…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-amber-500/40 bg-gradient-to-r from-amber-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E3-16 Certified</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {view.programmeCertified && <Badge variant="gold">Phase E3 Complete</Badge>}
        </div>
        <Link href="/cockpit/founder/financial-executive-certification" className="text-xs text-[#d4af37] hover:underline">
          Certification record →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Certification Gates</p>
          <p className="text-sm text-[#d4af37]">{view.gatesPassed}/{view.gatesTotal} PASS</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">E3 Subsystems</p>
          <p className="text-sm text-[#e8e0d0]">{view.certificationScope.filter((s) => s.status === "certified").length}/15</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Critical Defects</p>
          <p className="text-sm text-[#e8e0d0]">{view.criticalDefectCount}</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">Next Phase</p>
          <p className="line-clamp-1 text-sm text-[#e8e0d0]">{view.nextMission}</p>
        </div>
      </div>
    </section>
  );
}

/** E3-16 — Financial Executive Certification panel. */
export function FinancialExecutiveCertificationPanel() {
  const { view, loading, error, reload, live, data } = useFinancialExecutiveCertification();

  if (loading && !view) {
    return <Panel title="Financial Executive Certification">Loading certification…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Financial Executive Certification" subtitle="E3-16 · Programme Certification">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-xl border px-5 py-4 ${view.programmeCertified ? "border-amber-500/50 bg-gradient-to-br from-amber-500/[0.15] to-transparent" : "border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E3-16 Financial Executive Certified</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.programmeCertified ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.phaseE3Completed && <Badge variant="gold">Phase E3 COMPLETE</Badge>}
          {view.readyForE401 && (
            <Link href="/cockpit/founder/market-intelligence">
              <Badge variant="gold">E4-01 Active</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/executive-finance" className="text-xs text-[#d4af37] hover:underline">
            Executive Finance →
          </Link>
          <Link href="/cockpit/founder/executive-performance" className="text-xs text-[#d4af37] hover:underline">
            Performance Dashboard →
          </Link>
          <Link href="/cockpit/founder/executive-capital-strategy" className="text-xs text-[#d4af37] hover:underline">
            Capital Strategy →
          </Link>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.certificationSummary}</p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Certification Health" value={view.certificationHealth} />
        <StatCard label="Gates Passed" value={`${view.gatesPassed}/${view.gatesTotal}`} />
        <StatCard label="E3 Completion" value={`${view.e3CompletionPercentage ?? 100}%`} />
        <StatCard label="Certification Decision" value={view.certificationDecision ?? (view.programmeCertified ? "CERTIFIED" : "NOT_CERTIFIED")} />
      </div>

      {view.executiveReadinessAssessment && (
        <Panel title="AI Chief Financial Officer Assessment">
          <div className="space-y-2 text-sm text-[#c8c0b0]">
            <p><span className="text-[#6f6a60]">Readiness Score:</span> {view.executiveReadinessAssessment.readinessScore}/100 · {view.executiveReadinessAssessment.readinessLevel}</p>
            <p><span className="text-[#6f6a60]">AI CFO Operational:</span> {view.executiveReadinessAssessment.aiCfoOperational ? "YES" : "NO"}</p>
            <p><span className="text-[#6f6a60]">Capabilities:</span> {view.executiveReadinessAssessment.capabilitiesVerified}/{view.executiveReadinessAssessment.capabilitiesTotal} verified</p>
            <p><span className="text-[#6f6a60]">Workflows:</span> {view.executiveReadinessAssessment.workflowsPassed}/{view.executiveReadinessAssessment.workflowsTotal} passed</p>
            <p className="text-[#d4af37]">{view.executiveReadinessAssessment.summary}</p>
          </div>
        </Panel>
      )}

      {view.aiCfoCapabilityAssessment && view.aiCfoCapabilityAssessment.length > 0 && (
        <Panel title="AI CFO Capability Assessment (15 Executive Functions)">
          <DataTable
            columns={[
              { key: "label", header: "Capability" },
              { key: "missionId", header: "Mission" },
              { key: "status", header: "Status" },
              { key: "verified", header: "Verified" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.aiCfoCapabilityAssessment.map((c) => ({
              ...c,
              verified: c.verified ? "yes" : "no",
            }))}
          />
        </Panel>
      )}

      <Panel title="Certification Gates (17 Gates)">
        <DataTable
          columns={[
            { key: "gateNumber", header: "Gate" },
            { key: "label", header: "Requirement" },
            { key: "result", header: "Result" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.certificationGates}
        />
      </Panel>

      <Panel title="Certification Scope (E3-01 through E3-15)">
        <DataTable
          columns={[
            { key: "missionId", header: "Mission" },
            { key: "title", header: "Subsystem" },
            { key: "status", header: "Status" },
            { key: "healthScore", header: "Health" },
            { key: "integrated", header: "Integrated" },
          ]}
          rows={view.certificationScope.map((s) => ({
            ...s,
            integrated: s.integrated ? "yes" : "no",
          }))}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Capability Validations">
          <DataTable
            columns={[
              { key: "label", header: "Capability" },
              { key: "status", header: "Status" },
              { key: "verified", header: "Verified" },
            ]}
            rows={view.certificationValidations.map((v) => ({
              ...v,
              verified: v.verified ? "yes" : "no",
            }))}
          />
        </Panel>

        <Panel title="Integration Validations">
          <DataTable
            columns={[
              { key: "label", header: "Integration" },
              { key: "status", header: "Status" },
              { key: "verified", header: "Verified" },
            ]}
            rows={view.integrationValidations.map((v) => ({
              ...v,
              verified: v.verified ? "yes" : "no",
            }))}
          />
        </Panel>
      </div>

      <Panel title="Financial Quality Review">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.financialQualityReview}
        />
      </Panel>

      {view.workflowValidations && view.workflowValidations.length > 0 && (
        <Panel title="Executive Financial Workflow Validations">
          <DataTable
            columns={[
              { key: "label", header: "Workflow" },
              { key: "status", header: "Status" },
              { key: "verified", header: "Verified" },
              { key: "summary", header: "Summary" },
            ]}
            rows={view.workflowValidations.map((w) => ({
              ...w,
              verified: w.verified ? "yes" : "no",
            }))}
          />
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {view.stressTestResults && view.stressTestResults.length > 0 && (
          <Panel title="Stress & Resilience Tests">
            <DataTable
              columns={[
                { key: "label", header: "Test" },
                { key: "result", header: "Result" },
                { key: "summary", header: "Summary" },
              ]}
              rows={view.stressTestResults}
            />
          </Panel>
        )}

        {view.performanceBenchmarks && view.performanceBenchmarks.length > 0 && (
          <Panel title="Performance Benchmarks">
            <DataTable
              columns={[
                { key: "label", header: "Benchmark" },
                { key: "actualMs", header: "Actual (ms)" },
                { key: "targetMs", header: "Target (ms)" },
                { key: "status", header: "Status" },
              ]}
              rows={view.performanceBenchmarks}
            />
          </Panel>
        )}
      </div>

      {view.defects.length > 0 && (
        <Panel title="Defect Review">
          <DataTable
            columns={[
              { key: "title", header: "Defect" },
              { key: "severity", header: "Severity" },
              { key: "category", header: "Category" },
              { key: "recommendation", header: "Recommendation" },
            ]}
            rows={view.defects}
          />
        </Panel>
      )}

      <Panel title="Phase E3 Completion">
        <div className="space-y-2 text-sm text-[#c8c0b0]">
          <p><span className="text-[#6f6a60]">Phase E3 Completed:</span> {view.phaseE3Completed ? "YES" : "NO"}</p>
          <p><span className="text-[#6f6a60]">Next Phase:</span> {view.nextPhase}</p>
          <p><span className="text-[#6f6a60]">Ready for:</span> {view.nextMission}</p>
          <p className="text-[#d4af37]">
            {view.programmeCertified
              ? "The Financial Executive (E3) is constitutionally certified. Pillow possesses enterprise-grade financial executive capabilities."
              : "Certification pending — resolve defects before E4 commencement."}
          </p>
        </div>
      </Panel>
    </div>
  );
}
