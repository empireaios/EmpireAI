import { buildValidationEngineConfiguration } from "@empireai/pillow";
import type { ValidationEngineState, ValidationRunReport } from "@empireai/pillow";

function buildOfflineValidationState(): ValidationEngineState {
  const configuration = buildValidationEngineConfiguration();
  return {
    engineVersion: "PILLOW-VE-001",
    missionId: "T3-06",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      validationsCompleted: 0,
      lastValidationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      defectsDetectedTotal: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalValidations: 0,
      successfulValidations: 0,
      failedValidations: 0,
      totalDefectsDetected: 0,
      blockedChanges: 0,
      averageDefectsPerValidation: 0,
      averageValidationDurationMs: 0,
      peakValidationDurationMs: 0,
    },
  };
}

/** Fallback Validation Engine snapshot when Pillow session is unavailable. */
export function collectValidationEngineSnapshot() {
  const engine = buildOfflineValidationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      reportsCount: 0,
      defectsCount: 0,
      blockedCount: 0,
      confidenceScore: 0,
      totalValidations: 0,
      recentLogs: [],
    },
    latestReport: null as ValidationRunReport | null,
  };
}
