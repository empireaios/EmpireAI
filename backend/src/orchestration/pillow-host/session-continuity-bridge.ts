import { buildSessionContinuityConfiguration } from "@empireai/pillow";
import type { SessionContinuityState, SessionContinuityModel } from "@empireai/pillow";

function buildOfflineSessionContinuityState(): SessionContinuityState {
  const configuration = buildSessionContinuityConfiguration();
  return {
    engineVersion: "PILLOW-SCE-001",
    missionId: "T1-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestContinuity: null,
    previousContinuity: null,
    health: {
      status: "standby",
      healthScore: 50,
      continuityEnabled: configuration.enabled,
      isActive: false,
      lastSuccessfulUpdateAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      updatesPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalUpdates: 0,
      successfulUpdates: 0,
      failedUpdates: 0,
      interruptionsDetected: 0,
      recoveriesCompleted: 0,
      rehydrations: 0,
      stableStatesDetected: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedUpdates: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Session Continuity snapshot when Pillow session is unavailable. */
export function collectSessionContinuitySnapshot() {
  const engine = buildOfflineSessionContinuityState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-09",
    live: false,
    engine,
    cockpit: {
      continuityStatus: engine.status,
      healthStatus: engine.health.status,
      updatesApplied: 0,
      currentScreenId: null,
      recoveryStatus: null,
      lastKnownStableState: null,
      continuityConfidence: 0,
      interruptionDetected: false,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestContinuity: null as SessionContinuityModel | null,
  };
}
