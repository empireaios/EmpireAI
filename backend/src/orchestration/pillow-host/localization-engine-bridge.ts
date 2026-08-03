import { buildLocalizationEngineConfiguration } from "@empireai/pillow";
import type {
  LocalizationEngineState,
  LocRunReport,
} from "@empireai/pillow";

function buildOfflineLocalizationEngineState(): LocalizationEngineState {
  const configuration = buildLocalizationEngineConfiguration();
  return {
    engineVersion: "PILLOW-LOC-001",
    missionId: "X4-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalLocalizationRecords: 0,
      gapCount: 0,
      averageReadinessScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      productLocalizations: 0,
      serviceLocalizations: 0,
      storefrontLocalizations: 0,
      brandLocalizations: 0,
      marketingLocalizations: 0,
      experienceLocalizations: 0,
      regionalAdaptations: 0,
      gapsDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Localization Engine snapshot when Pillow session is unavailable. */
export function collectLocalizationEngineSnapshot() {
  const engine = buildOfflineLocalizationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLocalizationRecords: 0,
      gapCount: 0,
      averageReadinessScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as LocRunReport | null,
    localizationRecords: [],
    recommendations: [],
  };
}
