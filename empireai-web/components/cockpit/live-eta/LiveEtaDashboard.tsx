"use client";

import Link from "next/link";
import { Badge, Panel, StatCard } from "@/components/platform/ui/PlatformPrimitives";
import { DataModeBadge } from "@/components/cockpit/widgets/DataModeBadge";
import { formatLiveEtaDuration, useLiveEta } from "@/lib/live-eta/useLiveEta";
import type { LiveEtaExperience } from "@/lib/live-eta/types";

function Row({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between gap-3 border-b border-gold/5 py-2 text-sm last:border-0">
      <span className="text-[#8a847a]">{label}</span>
      <span className="text-right text-[#e8e0d0]">{value ?? "—"}</span>
    </div>
  );
}

/** Compact mission countdown strip for Builder Console and Executive awareness. */
export function LiveEtaCountdownStrip({ compact }: { compact?: boolean }) {
  const { view, loading, live, data } = useLiveEta();

  if (loading && !view) {
    return (
      <section className="rounded-xl border border-gold/15 bg-gold/[0.03] px-4 py-3 text-sm text-[#8a847a]">
        Loading live mission countdown…
      </section>
    );
  }

  if (!view) return null;

  const countdown = view.missionCountdown;

  return (
    <section className="rounded-xl border border-gold/25 bg-gradient-to-r from-gold/[0.08] to-transparent px-5 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="gold">P7-06 Live ETA</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          {!compact && (
            <Link href="/cockpit/founder/live-eta" className="text-xs text-[#d4af37] hover:underline">
              Full countdown →
            </Link>
          )}
        </div>
        <span className="text-xs text-[#6f6a60]">
          {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s refresh
        </span>
      </div>
      <div className={`mt-3 grid gap-4 ${compact ? "sm:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-5"}`}>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6f6a60]">Remaining</p>
          <p className="text-2xl font-light text-[#d4af37]">
            {formatLiveEtaDuration(countdown.remainingTimeMs)}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6f6a60]">Progress</p>
          <p className="text-2xl font-light text-[#e8e0d0]">{countdown.progressPercent}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6f6a60]">Predicted finish</p>
          <p className="text-sm text-[#c8c0b0]">
            {new Date(countdown.predictedCompletionAt).toLocaleString()}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6f6a60]">Confidence</p>
          <p className="text-sm text-[#c8c0b0]">
            {view.confidence.confidencePercent}% · {view.confidence.confidenceClassification}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-[#6f6a60]">Current step</p>
          <p className="text-sm text-[#c8c0b0]">{countdown.currentStep}</p>
        </div>
      </div>
    </section>
  );
}

function LiveEtaPanels({ view }: { view: LiveEtaExperience }) {
  const countdown = view.missionCountdown;
  const supervisor = view.supervisorTimer;
  const builder = view.builderCountdown;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Mission Countdown" value={formatLiveEtaDuration(countdown.remainingTimeMs)} />
        <StatCard label="Elapsed" value={formatLiveEtaDuration(countdown.elapsedTimeMs)} />
        <StatCard label="Progress" value={`${countdown.progressPercent}%`} />
        <StatCard label="Confidence" value={`${view.confidence.confidencePercent}%`} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Mission Countdown" subtitle={view.currentMission}>
          <Row label="Completed work" value={countdown.completedWork} />
          <Row label="Remaining work" value={countdown.remainingWork} />
          <Row label="Predicted completion" value={new Date(countdown.predictedCompletionAt).toLocaleString()} />
          <Row label="Current stage" value={countdown.currentStage} />
          <Row label="Current step" value={countdown.currentStep} />
          <Row label="Velocity" value={view.execution.velocityLabel} />
          <Row label="Current delay" value={view.execution.currentDelay} />
          <Row label="Bottleneck" value={view.execution.currentBottleneck} />
        </Panel>

        <Panel title="Supervisor Timer" subtitle={`Health: ${supervisor.missionHealth}`}>
          <Row label="Mission timer" value={supervisor.missionTimer} />
          <Row label="Elapsed" value={formatLiveEtaDuration(supervisor.elapsedTimeMs)} />
          <Row label="Remaining" value={formatLiveEtaDuration(supervisor.remainingTimeMs)} />
          <Row label="Phase" value={supervisor.currentPhase} />
          <Row label="Stage" value={supervisor.currentStage} />
          <Row label="Step" value={supervisor.currentStep} />
          <Row label="Heartbeat" value={supervisor.heartbeat} />
          <Row label="Velocity" value={supervisor.executionVelocity} />
          <Row label="Recovery delay" value={supervisor.recoveryDelay} />
          <Row label="Validation delay" value={supervisor.validationDelay} />
        </Panel>

        <Panel title="Builder Countdown" subtitle={builder.currentWorker}>
          <Row label="Current activity" value={builder.currentActivity} />
          <Row label="Current file" value={builder.currentFile} />
          <Row label="Repository activity" value={builder.repositoryActivity} />
          <Row label="Completed tasks" value={builder.completedTasks} />
          <Row label="Remaining tasks" value={builder.remainingTasks} />
          <Row label="Progress" value={`${builder.currentProgress}%`} />
          <Row label="Est. remaining work" value={builder.estimatedRemainingWork} />
          <Row label="Queue" value={builder.currentQueue} />
        </Panel>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Confidence" subtitle={view.confidence.confidenceClassification}>
          <p className="text-sm text-[#c8c0b0]">{view.confidence.reason}</p>
          {view.confidence.evidence.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-[#8a847a]">
              {view.confidence.evidence.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
          {view.confidence.knownUncertainty.length > 0 && (
            <p className="mt-3 text-xs text-amber-200/80">
              Uncertainty: {view.confidence.knownUncertainty.join("; ")}
            </p>
          )}
        </Panel>

        <Panel title="Pillow Analysis" subtitle={`Quality: ${view.pillow.predictionQuality}`}>
          {[...view.pillow.etaAccuracy, ...view.pillow.executionTrends].map((item) => (
            <p key={item} className="text-xs text-[#8a847a]">
              {item}
            </p>
          ))}
          {view.pillow.recommendations.length > 0 && (
            <ul className="mt-3 list-inside list-disc text-xs text-[#d4af37]">
              {view.pillow.recommendations.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </div>
  );
}

/** P7-06 — Permanent Live ETA Experience (mission countdown · supervisor · builder). */
export function LiveEtaDashboard() {
  const { view, loading, error, reload, live, data } = useLiveEta();

  if (loading && !view) {
    return <Panel title="Live ETA">Loading live mission countdown…</Panel>;
  }

  if (error || !view) {
    return (
      <Panel title="Live ETA" subtitle="P7-06 · Continuous mission countdown">
        <p className="text-sm text-amber-200">{error ?? "Unavailable"}</p>
        <button type="button" className="mt-3 text-sm text-[#d4af37]" onClick={() => void reload()}>
          Retry
        </button>
      </Panel>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-gold/20 bg-gradient-to-br from-gold/[0.06] to-transparent px-5 py-4">
        <div className="flex flex-wrap items-center gap-3">
          <Badge variant="gold">P7-06 Live ETA</Badge>
          <DataModeBadge mode={live ? "live" : "sandbox"} />
          <span className="text-xs text-[#6f6a60]">
            Updated {new Date(data?.computedAt ?? view.computedAt).toLocaleTimeString()} · 5s auto-refresh
          </span>
        </div>
        <p className="mt-3 text-sm text-[#c8c0b0]">{view.grandKingSummary}</p>
      </section>

      <LiveEtaCountdownStrip compact />
      <LiveEtaPanels view={view} />
    </div>
  );
}
