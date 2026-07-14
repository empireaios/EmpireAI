import type { BuilderTelemetrySnapshot } from "../builder-monitor/types.js";
import type { SupervisedMission } from "../supervisor/types.js";
import { classifyEtaConfidence, confidencePercentFromEvidence } from "./confidence-model.js";
import { ETA_PIPELINE_REGISTRY } from "./pipeline-registry.js";
import type { EtaEstimate, EtaEngineRequest, EtaUpdateTrigger } from "./types.js";

const DEFAULT_MISSION_DURATION_MS = 45 * 60 * 1000;
const RECOVERY_DELAY_MS = 5 * 60 * 1000;
const VALIDATION_DELAY_MS = 10 * 60 * 1000;
const DEPENDENCY_DELAY_MS = 3 * 60 * 1000;

export function computeExecutionVelocity(progress: number, elapsedMs: number): number {
  if (elapsedMs <= 0 || progress <= 0) return 0;
  return (progress / elapsedMs) * 1000 * 60;
}

export function calculateEtaEstimate(input: {
  telemetry: BuilderTelemetrySnapshot | null;
  activeMission: SupervisedMission | null;
  historicalDurationMs?: number;
  request?: EtaEngineRequest;
  now?: () => number;
}): EtaEstimate {
  const now = input.now ?? (() => Date.now());
  const at = new Date(now()).toISOString();
  const t = input.telemetry;
  const m = input.activeMission;
  const trigger = input.request?.trigger ?? "progress_change";

  const missionId = input.request?.missionId ?? m?.id ?? t?.currentRoadmapItem ?? null;
  const missionTitle = input.request?.missionTitle ?? m?.title ?? t?.currentMission ?? null;
  const hasActiveMission = Boolean(missionTitle || m);

  const elapsedMs = t?.elapsedTimeMs ?? (m ? now() - Date.parse(m.launchedAt) : 0);
  const completionPercent = t?.overallProgress ?? (m ? Math.min(95, m.progress.length * 10 + 15) : 0);
  const velocity = computeExecutionVelocity(completionPercent, Math.max(elapsedMs, 1));

  let remainingWorkMs =
    completionPercent > 0 && completionPercent < 100
      ? Math.round(elapsedMs * (100 / completionPercent - 1))
      : DEFAULT_MISSION_DURATION_MS;

  let dependencyDelayMs = 0;
  const blockingDependencies: string[] = [];
  if (m?.dependencies.length) {
    blockingDependencies.push(...m.dependencies);
    dependencyDelayMs = m.dependencies.length * DEPENDENCY_DELAY_MS;
  } else if (t?.currentDependency) {
    blockingDependencies.push(t.currentDependency);
    dependencyDelayMs = DEPENDENCY_DELAY_MS;
  }

  let recoveryDelayMs = 0;
  const recoveryActive =
    t?.recoveryState === "active" ||
    m?.state === "recovery" ||
    m?.state === "recovering" ||
    (m?.recoveryAttempts ?? 0) > 0;
  if (recoveryActive) {
    recoveryDelayMs = RECOVERY_DELAY_MS * (m?.recoveryAttempts ?? 1);
  }

  let validationDelayMs = 0;
  const validationActive =
    t?.validationState === "in_progress" ||
    m?.state === "validation" ||
    m?.state === "validating";
  if (validationActive) {
    validationDelayMs = VALIDATION_DELAY_MS;
  }

  const historicalMs = input.historicalDurationMs ?? DEFAULT_MISSION_DURATION_MS;
  const historicalAdjustment =
    historicalMs > 0 && elapsedMs > 0
      ? Math.round((historicalMs - elapsedMs - remainingWorkMs) * 0.15)
      : 0;

  const estimatedRemainingTimeMs = Math.max(
    0,
    remainingWorkMs + dependencyDelayMs + recoveryDelayMs + validationDelayMs + historicalAdjustment,
  );

  const confidencePercent = confidencePercentFromEvidence({
    progressKnown: completionPercent > 0,
    velocityKnown: velocity > 0,
    heartbeatRecent: Boolean(t?.heartbeatAt),
    supervisorSynced: Boolean(m),
    builderSynced: Boolean(t?.currentActivity),
    historicalAvailable: Boolean(input.historicalDurationMs),
  });

  const evidence: string[] = [
    `Elapsed: ${Math.round(elapsedMs / 1000)}s · Progress: ${completionPercent}%`,
    `Velocity: ${velocity.toFixed(2)}%/min`,
    `Trigger: ${trigger.replace(/_/g, " ")}`,
  ];
  if (recoveryActive) evidence.push(`Recovery delay: ${Math.round(recoveryDelayMs / 1000)}s`);
  if (validationActive) evidence.push(`Validation delay: ${Math.round(validationDelayMs / 1000)}s`);
  if (blockingDependencies.length) {
    evidence.push(`Dependencies: ${blockingDependencies.join(", ")}`);
  }

  const knownUncertainty: string[] = [];
  if (completionPercent <= 0) knownUncertainty.push("Progress not yet reported");
  if (velocity <= 0) knownUncertainty.push("Execution velocity unknown");
  if (!t?.heartbeatAt) knownUncertainty.push("No recent Builder heartbeat");

  const confidenceLevel = classifyEtaConfidence({
    confidencePercent,
    evidenceCount: evidence.length,
    hasActiveMission,
    hasRecovery: recoveryActive,
    hasBlockingDeps: blockingDependencies.length > 0,
  });

  let currentDelayReason: string | null = null;
  if (recoveryActive) currentDelayReason = "Recovery in progress";
  else if (validationActive) currentDelayReason = "Validation phase";
  else if (blockingDependencies.length) currentDelayReason = "Dependency wait";
  else if (t?.currentErrors.length) currentDelayReason = t.currentErrors[0] ?? null;

  const criticalPath = [
    t?.currentPhase ?? m?.state ?? "preparation",
    t?.currentStep ?? "current step",
    t?.validationState !== "not_started" ? `validation: ${t?.validationState}` : "validation pending",
  ].filter(Boolean);

  const predictedCompletionAt = new Date(now() + estimatedRemainingTimeMs).toISOString();

  let recommendedAction = "Continue execution — ETA stable";
  if (confidenceLevel === "low" || confidenceLevel === "unknown") {
    recommendedAction = "Increase Builder telemetry — refresh heartbeat and progress";
  } else if (recoveryActive) {
    recommendedAction = "Monitor recovery — ETA extended until recovery completes";
  } else if (blockingDependencies.length) {
    recommendedAction = "Resolve blocking dependencies to improve ETA confidence";
  }

  return {
    missionId,
    missionTitle,
    capturedAt: at,
    elapsedTimeMs: elapsedMs,
    estimatedRemainingTimeMs,
    predictedCompletionAt,
    confidencePercent,
    confidenceLevel,
    completionPercent,
    executionVelocity: velocity,
    criticalPath,
    blockingDependencies,
    currentDelayReason,
    lastEtaUpdate: at,
    reason: `Evidence-based ETA from ${trigger.replace(/_/g, " ")} — ${completionPercent}% complete`,
    evidence,
    knownUncertainty,
    recommendedAction,
    pipeline: ETA_PIPELINE_REGISTRY,
  };
}

export function triggerFromBuilderEvent(
  kind: string,
): EtaUpdateTrigger | null {
  switch (kind) {
    case "mission_started":
    case "mission_updated":
      return "mission_state_change";
    case "progress_changed":
      return "progress_change";
    case "dependency_changed":
      return "dependency_change";
    case "recovery_started":
      return "recovery_begin";
    case "recovery_completed":
      return "recovery_end";
    case "validation_started":
      return "validation_begin";
    case "validation_completed":
      return "validation_end";
    case "repository_updated":
      return "repository_activity_change";
    case "heartbeat":
      return "execution_velocity_change";
    default:
      return null;
  }
}
