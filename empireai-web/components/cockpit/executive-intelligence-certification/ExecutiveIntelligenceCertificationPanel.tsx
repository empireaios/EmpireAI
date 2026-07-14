"use client";

import Link from "next/link";
import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { useExecutiveIntelligenceCertification } from "@/lib/executive-intelligence-certification/useExecutiveIntelligenceCertification";

/** Compact E4 Certification strip for Executive Home. */
export function ExecutiveIntelligenceCertificationStrip() {
  const { view, loading, live } = useExecutiveIntelligenceCertification();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 px-4 py-3 text-sm text-[#8a847a]">
        Loading E4 Certification…
      </section>
    );
  }

  if (!view) return null;

  return (
    <section className="rounded-xl border border-emerald-500/40 bg-gradient-to-r from-emerald-500/[0.15] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="gold">E4-15 Certified</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {view.programmeCertified && <Badge variant="gold">Phase E4 Complete</Badge>}
        </div>
        <Link href="/cockpit/founder/executive-intelligence-certification" className="text-xs text-[#d4af37] hover:underline">
          Certification record →
        </Link>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-4">
        <div>
          <p className="text-xs text-[#6f6a60]">Certification Gates</p>
          <p className="text-sm text-[#d4af37]">{view.gatesPassed}/{view.gatesTotal} PASS</p>
        </div>
        <div>
          <p className="text-xs text-[#6f6a60]">E4 Subsystems</p>
          <p className="text-sm text-[#e8e0d0]">{view.certificationScope.filter((s) => s.status === "certified").length}/14</p>
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

/** E4-15 — Executive Intelligence Programme Certification panel. */
export function ExecutiveIntelligenceCertificationPanel() {
  const { view, loading, error, reload, live, data } = useExecutiveIntelligenceCertification();

  if (loading && !view) {
    return <Panel title="Executive Intelligence Certification">Loading certification…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Executive Intelligence Certification" subtitle="E4-15 · Programme Certification">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`rounded-xl border px-5 py-4 ${view.programmeCertified ? "border-emerald-500/50 bg-gradient-to-br from-emerald-500/[0.15] to-transparent" : "border-gold/40 bg-gradient-to-br from-gold/[0.15] to-transparent"}`}>
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">E4-15 Executive Intelligence Certified</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <StatusBadge status={view.programmeCertified ? "healthy" : view.healthScore >= 70 ? "stable" : "attention"} />
          {view.phaseE4Completed && <Badge variant="gold">Phase E4 COMPLETE</Badge>}
          {view.readyForE501 && (
            <Link href="/cockpit/founder/enterprise-governance">
              <Badge variant="gold">E5-01 Active →</Badge>
            </Link>
          )}
          <Link href="/cockpit/founder/market-intelligence" className="text-xs text-[#d4af37] hover:underline">
            Market Intelligence →
          </Link>
          <Link href="/cockpit/founder/executive-advisory" className="text-xs text-[#d4af37] hover:underline">
            Intelligence Dashboard →
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
        <StatCard label="Programme Certified" value={view.programmeCertified ? "YES" : "NO"} />
        <StatCard label="Next Mission" value={view.nextMission} />
      </div>

      <Panel title="Certification Gates (16 Gates)">
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

      <Panel title="Certification Scope (E4-01 through E4-14)">
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

      <Panel title="Executive Quality Review">
        <DataTable
          columns={[
            { key: "label", header: "Domain" },
            { key: "score", header: "Score" },
            { key: "status", header: "Status" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.executiveQualityReview}
        />
      </Panel>

      <Panel title="Grand King Acceptance — Executive Intelligence Capabilities">
        <DataTable
          columns={[
            { key: "label", header: "Capability" },
            { key: "verified", header: "Verified" },
            { key: "summary", header: "Summary" },
          ]}
          rows={view.executiveCapabilityAssessment.map((c) => ({
            ...c,
            verified: c.verified ? "yes" : "no",
          }))}
        />
      </Panel>

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

      <Panel title="Phase E4 Completion">
        <div className="space-y-2 text-sm text-[#c8c0b0]">
          <p><span className="text-[#6f6a60]">Phase E4 Completed:</span> {view.phaseE4Completed ? "YES" : "NO"}</p>
          <p><span className="text-[#6f6a60]">Next Phase:</span> {view.nextPhase}</p>
          <p><span className="text-[#6f6a60]">Ready for:</span> {view.nextMission}</p>
          <p className="text-[#d4af37]">
            {view.programmeCertified
              ? "The Executive Intelligence Programme (E4) is constitutionally certified. Pillow possesses enterprise-grade Executive Intelligence capabilities."
              : "Certification incomplete — resolve defects before Phase E5."}
          </p>
        </div>
      </Panel>
    </div>
  );
}
