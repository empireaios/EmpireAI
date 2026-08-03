import { buildGlobalTaxIntelligenceConfiguration } from "@empireai/pillow";
import type {
  GlobalTaxIntelligenceState,
  GtiRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalTaxIntelligenceState(): GlobalTaxIntelligenceState {
  const configuration = buildGlobalTaxIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-GTI-001",
    missionId: "X4-07",
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
      totalTaxRecords: 0,
      highRiskCount: 0,
      optimizationCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      countryRuleOps: 0,
      regulationMonitors: 0,
      indirectOps: 0,
      directOps: 0,
      crossBorderOps: 0,
      obligationEstimates: 0,
      complianceRiskDetections: 0,
      optimizationDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Tax Intelligence snapshot when Pillow session is unavailable. */
export function collectGlobalTaxIntelligenceSnapshot() {
  const engine = buildOfflineGlobalTaxIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalTaxRecords: 0,
      highRiskCount: 0,
      optimizationCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as GtiRunReport | null,
    taxRecords: [],
    recommendations: [],
  };
}
