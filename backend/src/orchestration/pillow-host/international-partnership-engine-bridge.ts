import { buildInternationalPartnershipEngineConfiguration } from "@empireai/pillow";
import type {
  InternationalPartnershipEngineState,
  IpeRunReport,
} from "@empireai/pillow";

function buildOfflineInternationalPartnershipEngineState(): InternationalPartnershipEngineState {
  const configuration = buildInternationalPartnershipEngineConfiguration();
  return {
    engineVersion: "PILLOW-IPE-001",
    missionId: "X4-12",
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
      totalPartnershipRecords: 0,
      riskCount: 0,
      opportunityCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      strategicPartnershipOps: 0,
      regionalNetworkOps: 0,
      prospectiveEvaluations: 0,
      performanceMonitors: 0,
      reliabilityMonitors: 0,
      valueMonitors: 0,
      riskDetections: 0,
      opportunityDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback International Partnership Engine snapshot when Pillow session is unavailable. */
export function collectInternationalPartnershipEngineSnapshot() {
  const engine = buildOfflineInternationalPartnershipEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPartnershipRecords: 0,
      riskCount: 0,
      opportunityCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as IpeRunReport | null,
    partnershipRecords: [],
    recommendations: [],
  };
}
