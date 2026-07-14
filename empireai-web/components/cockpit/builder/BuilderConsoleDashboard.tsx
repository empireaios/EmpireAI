"use client";

import { Badge, DataTable, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { StatusBadge } from "@/components/cockpit/widgets/shared/statusBadges";
import { LiveEtaCountdownStrip } from "@/components/cockpit/live-eta/LiveEtaDashboard";
import { useBuilderConsole } from "@/lib/builder-console/useBuilderConsole";

function formatDuration(ms: number): string {
  const sec = Math.round(ms / 1000);
  if (sec < 60) return `${sec}s`;
  return `${Math.floor(sec / 60)}m ${sec % 60}s`;
}

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gold/5 py-2 text-sm last:border-0">
      <span className="text-[#8a847a]">{label}</span>
      <span className="text-right text-[#e8e0d0]">{value}</span>
    </div>
  );
}

/** P7-05 — Permanent Builder Console (live engineering command centre). */
export function BuilderConsoleDashboard() {
  const { view, loading, error, reload, live, data } = useBuilderConsole();

  if (loading && !view) {
    return <Panel title="Builder Console">Loading live Builder execution…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Builder Console" subtitle="P7-05 · Live engineering command centre">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  const exec = view.liveExecution;

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P7-05 Builder Console</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <Badge variant={exec.executionHealth === "healthy" ? "success" : "warning"}>
            {exec.executionHealth}
          </Badge>
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <LiveEtaCountdownStrip compact />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Progress" value={`${exec.overallProgress}%`} />
        <StatCard label="Stage" value={`${exec.stageProgress}%`} />
        <StatCard label="Elapsed" value={formatDuration(exec.elapsedTimeMs)} />
        <StatCard
          label="ETA"
          value={
            exec.estimatedRemainingTimeMs != null
              ? formatDuration(exec.estimatedRemainingTimeMs)
              : view.supervisor.eta
          }
        />
      </div>

      <Panel title="Live Execution" subtitle={`${exec.currentMission} · ${exec.currentRoadmapItem}`}>
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <Row label="Mission State" value={exec.missionState} />
            <Row label="Phase" value={exec.currentPhase} />
            <Row label="Purpose" value={exec.missionPurpose} />
            <Row label="Current Step" value={exec.currentStep} />
            <Row label="Activity" value={exec.currentActivity} />
            <Row label="Velocity" value={exec.executionVelocity} />
            <Row label="Heartbeat" value={exec.heartbeatAt ?? "—"} />
          </div>
          <div>
            <Row label="Repository" value={exec.currentRepository} />
            <Row label="Branch" value={exec.currentBranch ?? "—"} />
            <Row label="Validation" value={exec.validationStatus} />
            <Row label="Recovery" value={exec.recoveryStatus} />
            {exec.currentRisks.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] uppercase text-red-300/80">Risks</p>
                <ul className="mt-1 text-xs text-red-200/90">
                  {exec.currentRisks.map((r) => (
                    <li key={r}>• {r}</li>
                  ))}
                </ul>
              </div>
            )}
            {exec.currentWarnings.length > 0 && (
              <div className="mt-2">
                <p className="text-[10px] uppercase text-amber-200/80">Warnings</p>
                <ul className="mt-1 text-xs text-amber-100/90">
                  {exec.currentWarnings.map((w) => (
                    <li key={w}>• {w}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Mission Timeline">
          {view.missionTimeline.length === 0 ? (
            <p className="text-sm text-[#6f6a60]">No timeline events yet</p>
          ) : (
            <DataTable
              keyField="at"
              data={view.missionTimeline.map((e, i) => ({
                id: `${e.at}-${i}`,
                at: new Date(e.at).toLocaleTimeString(),
                category: e.category,
                label: e.label,
                detail: e.detail.slice(0, 60),
              }))}
              columns={[
                { key: "at", header: "Time" },
                { key: "category", header: "Type" },
                { key: "label", header: "Event" },
                { key: "detail", header: "Detail" },
              ]}
            />
          )}
        </Panel>

        <Panel title="Repository Activity">
          <Row label="Health" value={view.repositoryActivity.repositoryHealth} />
          <Row label="Pending Validation" value={view.repositoryActivity.pendingValidation} />
          <Row label="Current File" value={view.repositoryActivity.currentFile ?? "—"} />
          {view.repositoryActivity.filesModified.length > 0 && (
            <p className="mt-3 text-xs text-[#8a847a]">
              Modified: {view.repositoryActivity.filesModified.slice(0, 8).join(", ")}
            </p>
          )}
          {view.repositoryActivity.branches.length > 0 && (
            <p className="mt-2 text-xs text-[#8a847a]">
              Branches: {view.repositoryActivity.branches.join(", ")}
            </p>
          )}
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Validation Panel">
          <Row label="Architecture Review" value={view.validation.architectureReview} />
          <Row label="Repository Review" value={view.validation.repositoryReview} />
          <Row label="Testing" value={view.validation.testing} />
          <Row label="Browser Truth" value={view.validation.browserTruth} />
          <Row label="Production" value={view.validation.productionValidation} />
          <Row label="Grand King Acceptance" value={view.validation.grandKingAcceptance} />
          <div className="mt-3">
            <StatusBadge status={view.validation.currentStatus} />
          </div>
        </Panel>

        <Panel title="Recovery Panel">
          <Row label="Status" value={view.recovery.recoveryStatus} />
          <Row label="Attempts" value={view.recovery.recoveryAttempts} />
          <Row label="Confidence" value={view.recovery.recoveryConfidence} />
          <Row label="Incident" value={view.recovery.currentIncident ?? "None"} />
          <Row label="Escalation" value={view.recovery.currentEscalation ?? "None"} />
        </Panel>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Pillow" subtitle="Recommendations & warnings">
          <ul className="space-y-1 text-sm text-[#c8c0b0]">
            {view.pillow.recommendations.map((r) => (
              <li key={r}>◆ {r}</li>
            ))}
          </ul>
        </Panel>
        <Panel title="Supervisor" subtitle={view.supervisor.missionHealth}>
          <Row label="State" value={view.supervisor.executionState} />
          <Row label="Progress" value={view.supervisor.progress} />
          <Row label="ETA" value={view.supervisor.eta} />
          <p className="mt-2 text-xs text-[#8a847a]">{view.supervisor.grandKingSummary}</p>
        </Panel>
        <Panel title="ECC" subtitle="Execution coordination">
          <Row label="Priority" value={view.ecc.executionPriority} />
          <Row label="Dependencies" value={view.ecc.dependencyStatus} />
          <Row label="Resources" value={view.ecc.resourceAllocation} />
          <ul className="mt-2 space-y-1 text-xs text-[#8a847a]">
            {view.ecc.missionQueue.map((m) => (
              <li key={m}>→ {m}</li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
