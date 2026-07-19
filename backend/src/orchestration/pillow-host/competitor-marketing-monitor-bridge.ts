import { buildCompetitorMarketingMonitorConfiguration } from "@empireai/pillow";
import type {
  CompetitorMarketingMonitorState,
  CompetitorMarketingRunReport,
} from "@empireai/pillow";

function buildOfflineCompetitorMarketingMonitorState(): CompetitorMarketingMonitorState {
  const configuration = buildCompetitorMarketingMonitorConfiguration();
  return {
    engineVersion: "PILLOW-CMM-001",
    missionId: "R5-15",
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
      totalCompetitorRecords: 0,
      averageCompetitiveScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      discoveriesRun: 0,
      monitoringRuns: 0,
      intelligenceGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Competitor Marketing Monitor snapshot when Pillow session is unavailable. */
export function collectCompetitorMarketingMonitorSnapshot() {
  const engine = buildOfflineCompetitorMarketingMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-15",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCompetitorRecords: 0,
      averageCompetitiveScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CompetitorMarketingRunReport | null,
    competitorRecords: [],
  };
}
