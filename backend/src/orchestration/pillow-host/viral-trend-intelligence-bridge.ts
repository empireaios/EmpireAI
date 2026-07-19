import { buildViralTrendIntelligenceConfiguration } from "@empireai/pillow";
import type {
  ViralTrendIntelligenceState,
  ViralTrendRunReport,
} from "@empireai/pillow";

function buildOfflineViralTrendIntelligenceState(): ViralTrendIntelligenceState {
  const configuration = buildViralTrendIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-VTI-001",
    missionId: "R5-16",
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
      totalTrendRecords: 0,
      averageTrendScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      discoveriesRun: 0,
      monitoringRuns: 0,
      predictionsGenerated: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Viral Trend Intelligence snapshot when Pillow session is unavailable. */
export function collectViralTrendIntelligenceSnapshot() {
  const engine = buildOfflineViralTrendIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalTrendRecords: 0,
      averageTrendScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as ViralTrendRunReport | null,
    trendRecords: [],
  };
}
