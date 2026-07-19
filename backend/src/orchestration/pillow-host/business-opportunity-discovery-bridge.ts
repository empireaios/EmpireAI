import { buildBusinessOpportunityDiscoveryConfiguration } from "@empireai/pillow";
import type {
  BusinessOpportunityDiscoveryState,
  BusinessOpportunityRunReport,
} from "@empireai/pillow";

function buildOfflineBusinessOpportunityDiscoveryState(): BusinessOpportunityDiscoveryState {
  const configuration = buildBusinessOpportunityDiscoveryConfiguration();
  return {
    engineVersion: "PILLOW-BOD-001",
    missionId: "X1-02",
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
      totalOpportunityRecords: 0,
      averageOpportunityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      discoveriesRun: 0,
      monitoringRuns: 0,
      scoringRuns: 0,
      rankingRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Business Opportunity Discovery snapshot when Pillow session is unavailable. */
export function collectBusinessOpportunityDiscoverySnapshot() {
  const engine = buildOfflineBusinessOpportunityDiscoveryState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalOpportunityRecords: 0,
      averageOpportunityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as BusinessOpportunityRunReport | null,
    opportunityRecords: [],
  };
}
