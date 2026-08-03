import { buildGlobalTalentIntelligenceConfiguration } from "@empireai/pillow";
import type {
  GlobalTalentIntelligenceState,
  TalRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalTalentIntelligenceState(): GlobalTalentIntelligenceState {
  const configuration = buildGlobalTalentIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-TAL-001",
    missionId: "X4-13",
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
      totalWorkforceRecords: 0,
      shortageCount: 0,
      opportunityCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      availabilityMonitors: 0,
      regionalTalentOps: 0,
      capabilityMonitors: 0,
      performanceMonitors: 0,
      costMonitors: 0,
      utilizationMonitors: 0,
      shortageDetections: 0,
      opportunityDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Talent Intelligence snapshot when Pillow session is unavailable. */
export function collectGlobalTalentIntelligenceSnapshot() {
  const engine = buildOfflineGlobalTalentIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-13",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalWorkforceRecords: 0,
      shortageCount: 0,
      opportunityCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as TalRunReport | null,
    workforceRecords: [],
    recommendations: [],
  };
}
