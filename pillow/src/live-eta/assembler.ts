import type { EtaEstimate } from "../eta-engine/types.js";
import type { BuilderTelemetrySnapshot } from "../builder-monitor/types.js";
import type { LiveEtaExperience } from "./types.js";

function formatDuration(ms: number): string {
  if (ms < 60_000) return `${Math.round(ms / 1000)}s`;
  if (ms < 3_600_000) return `${Math.round(ms / 60_000)}m`;
  return `${(ms / 3_600_000).toFixed(1)}h`;
}

function defaultEstimate(): EtaEstimate {
  const at = new Date().toISOString();
  return {
    missionId: null,
    missionTitle: null,
    capturedAt: at,
    elapsedTimeMs: 0,
    estimatedRemainingTimeMs: 0,
    predictedCompletionAt: at,
    confidencePercent: 0,
    confidenceLevel: "unknown",
    completionPercent: 0,
    executionVelocity: 0,
    criticalPath: [],
    blockingDependencies: [],
    currentDelayReason: null,
    lastEtaUpdate: at,
    reason: "Awaiting live execution evidence",
    evidence: [],
    knownUncertainty: ["Pillow session or active mission required"],
    recommendedAction: "Start Builder mission for live countdown",
    pipeline: [],
  };
}

export function assembleLiveEtaExperience(input: {
  estimate?: EtaEstimate | null;
  telemetry?: BuilderTelemetrySnapshot | null;
  supervisor?: Record<string, unknown>;
  etaAnalysis?: { recommendations?: string[]; etaAccuracy?: string[]; predictionQuality?: string[]; historicalTrends?: string[]; executionEfficiency?: string[]; planningImprovements?: string[] };
  pillowAssessment?: { grandKingSummary?: string; predictionQuality?: string; recommendations?: string[] };
}): LiveEtaExperience {
  const estimate = input.estimate ?? defaultEstimate();
  const t = input.telemetry;
  const supervisor = input.supervisor ?? {};
  const analysis = input.etaAnalysis ?? {};
  const assessment = input.pillowAssessment ?? {};

  const progress = estimate.completionPercent || t?.overallProgress || 0;
  const remainingMs = estimate.estimatedRemainingTimeMs;
  const elapsedMs = estimate.elapsedTimeMs || t?.elapsedTimeMs || 0;
  const missionTitle =
    estimate.missionTitle ?? t?.currentMission ?? String(supervisor.currentMission ?? "No active mission");

  const recoveryDelay =
    t?.recoveryState && t.recoveryState !== "none" ? t.recoveryState : "None";
  const validationDelay =
    t?.validationState && t.validationState !== "not_started" && t.validationState !== "passed"
      ? t.validationState
      : "None";

  return {
    architectureVersion: "P7-06",
    computedAt: new Date().toISOString(),
    currentMission: missionTitle,
    grandKingSummary:
      assessment.grandKingSummary ??
      estimate.reason ??
      "Live ETA — continuous countdown from execution evidence",
    missionCountdown: {
      remainingTimeMs: remainingMs,
      predictedCompletionAt: estimate.predictedCompletionAt,
      progressPercent: progress,
      completedWork: `${progress}% complete · ${formatDuration(elapsedMs)} elapsed`,
      remainingWork: `${100 - progress}% · ~${formatDuration(remainingMs)} remaining`,
      currentStage: t?.currentPhase ?? String(supervisor.currentPhase ?? "—"),
      currentStep: t?.currentStep ?? String(supervisor.currentStep ?? estimate.pipeline[0]?.stage ?? "—"),
      elapsedTimeMs: elapsedMs,
    },
    supervisorTimer: {
      missionTimer: formatDuration(elapsedMs),
      elapsedTimeMs: elapsedMs,
      remainingTimeMs: remainingMs,
      currentPhase: String(supervisor.currentPhase ?? t?.currentPhase ?? "—"),
      currentStage: t?.currentPhase ?? "execution",
      currentStep: String(supervisor.currentStep ?? t?.currentStep ?? "—"),
      heartbeat: t?.heartbeatAt ?? String(supervisor.heartbeat ?? "—"),
      executionVelocity: `${estimate.executionVelocity.toFixed(2)}%/min`,
      recoveryDelay,
      validationDelay,
      missionHealth: String(supervisor.missionHealth ?? t?.executionHealth ?? "healthy"),
    },
    builderCountdown: {
      currentActivity: t?.currentActivity ?? "—",
      currentFile: t?.currentFile ?? null,
      repositoryActivity: t?.repositoryActivity ?? "None",
      completedTasks: `${progress}% of mission scope`,
      remainingTasks: `${100 - progress}% remaining`,
      currentProgress: progress,
      estimatedRemainingWork: formatDuration(remainingMs),
      currentQueue: t?.currentQueue ?? null,
      currentWorker: t?.currentWorker ?? "builder",
    },
    confidence: {
      confidencePercent: estimate.confidencePercent,
      confidenceClassification: estimate.confidenceLevel.replace(/_/g, " "),
      reason: estimate.reason,
      evidence: estimate.evidence,
      knownUncertainty: estimate.knownUncertainty,
    },
    execution: {
      executionVelocity: estimate.executionVelocity,
      velocityLabel: `${estimate.executionVelocity.toFixed(2)}%/min`,
      currentDelay: estimate.currentDelayReason,
      currentBottleneck:
        estimate.blockingDependencies.length > 0
          ? estimate.blockingDependencies.join(", ")
          : null,
      criticalPath: estimate.criticalPath,
      lastUpdateAt: estimate.lastEtaUpdate,
      updateTrigger: estimate.pipeline.length > 0 ? "live evidence" : "standby",
    },
    pillow: {
      etaAccuracy: analysis.etaAccuracy ?? [],
      predictionQuality: assessment.predictionQuality ?? analysis.predictionQuality?.[0] ?? "unknown",
      executionTrends: analysis.executionEfficiency ?? [],
      historicalComparisons: analysis.historicalTrends ?? [],
      delayPatterns: estimate.currentDelayReason ? [estimate.currentDelayReason] : [],
      improvementOpportunities: analysis.planningImprovements ?? [],
      recommendations: [
        estimate.recommendedAction,
        ...(assessment.recommendations ?? []),
        ...(analysis.recommendations ?? []),
      ].filter(Boolean),
    },
  };
}

export function buildFallbackLiveEtaExperience(): LiveEtaExperience {
  return assembleLiveEtaExperience({
    estimate: defaultEstimate(),
    pillowAssessment: {
      grandKingSummary: "Start Pillow session and Builder mission for live mission countdown",
    },
  });
}
