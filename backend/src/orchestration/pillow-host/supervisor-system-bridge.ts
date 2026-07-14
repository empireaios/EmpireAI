import type { SupervisorSystemSnapshot } from "@empireai/pillow";

/** Collect live Supervisor snapshot (P6-03). */
export function collectSupervisorSystemSnapshot(input?: {
  activeMissionId?: string | null;
  activeMissionTitle?: string | null;
  missionHealth?: SupervisorSystemSnapshot["missionHealth"];
  currentPhase?: string | null;
  currentStep?: string | null;
  overallProgressPercent?: number;
  executionState?: string | null;
}): SupervisorSystemSnapshot {
  return {
    capturedAt: new Date().toISOString(),
    activeMissionId: input?.activeMissionId ?? null,
    activeMissionTitle: input?.activeMissionTitle ?? null,
    missionHealth: input?.missionHealth ?? "healthy",
    currentPhase: input?.currentPhase ?? null,
    currentStep: input?.currentStep ?? null,
    currentActivity: input?.currentStep ?? null,
    overallProgressPercent: input?.overallProgressPercent ?? 0,
    executionState: input?.executionState ?? "ready",
    activeDependencies: [],
    currentRisks: [],
    currentWarnings: [],
    recoveryStatus: null,
    validationStatus: null,
  };
}
