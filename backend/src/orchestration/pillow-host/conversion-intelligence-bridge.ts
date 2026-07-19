import { buildConversionIntelligenceConfiguration } from "@empireai/pillow";
import type {
  ConversionIntelligenceState,
  ConversionIntelligenceRunReport,
} from "@empireai/pillow";

function buildOfflineConversionIntelligenceState(): ConversionIntelligenceState {
  const configuration = buildConversionIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-CVI-001",
    missionId: "R5-14",
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
      totalConversionRecords: 0,
      averageConversionRate: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      funnelsTracked: 0,
      optimizationsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Conversion Intelligence snapshot when Pillow session is unavailable. */
export function collectConversionIntelligenceSnapshot() {
  const engine = buildOfflineConversionIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalConversionRecords: 0,
      averageConversionRate: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as ConversionIntelligenceRunReport | null,
    conversionRecords: [],
  };
}
