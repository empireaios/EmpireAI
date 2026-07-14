import type { BuilderTelemetrySnapshot } from "@empireai/pillow";

/** Collect live Builder Monitor snapshot (P6-04). */
export function collectBuilderMonitorSnapshot(input?: {
  currentMission?: string | null;
  currentStep?: string | null;
  overallProgress?: number;
  executionHealth?: BuilderTelemetrySnapshot["executionHealth"];
  heartbeatAt?: string | null;
}): BuilderTelemetrySnapshot {
  const at = new Date().toISOString();
  return {
    capturedAt: at,
    currentMission: input?.currentMission ?? null,
    currentRoadmapItem: null,
    currentPhase: null,
    currentStep: input?.currentStep ?? null,
    currentActivity: null,
    missionState: null,
    overallProgress: input?.overallProgress ?? 0,
    stageProgress: 0,
    estimatedRemainingTimeMs: null,
    elapsedTimeMs: 0,
    currentFile: null,
    filesModified: [],
    repositoryActivity: null,
    currentBranch: null,
    currentDependency: null,
    currentQueue: null,
    currentWorker: "builder",
    validationState: "not_started",
    productionState: "standby",
    recoveryState: "none",
    currentErrors: [],
    currentWarnings: [],
    heartbeatAt: input?.heartbeatAt ?? at,
    executionHealth: input?.executionHealth ?? "healthy",
  };
}
