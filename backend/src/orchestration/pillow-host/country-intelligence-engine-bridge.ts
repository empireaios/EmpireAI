import { buildCountryIntelligenceEngineConfiguration } from "@empireai/pillow";
import type {
  CountryIntelligenceEngineState,
  CieRunReport,
} from "@empireai/pillow";

function buildOfflineCountryIntelligenceEngineState(): CountryIntelligenceEngineState {
  const configuration = buildCountryIntelligenceEngineConfiguration();
  return {
    engineVersion: "PILLOW-CIE-001",
    missionId: "X4-02",
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
      totalCountryRecords: 0,
      highPriorityCount: 0,
      averageCompositeScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      countryEvaluations: 0,
      economicMonitors: 0,
      marketAnalyses: 0,
      readinessAssessments: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Country Intelligence Engine snapshot when Pillow session is unavailable. */
export function collectCountryIntelligenceEngineSnapshot() {
  const engine = buildOfflineCountryIntelligenceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCountryRecords: 0,
      highPriorityCount: 0,
      averageCompositeScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CieRunReport | null,
    countryRecords: [],
    recommendations: [],
  };
}
