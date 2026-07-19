import { buildAudienceIntelligenceConfiguration } from "@empireai/pillow";
import type { AudienceIntelligenceState, AudienceRunReport } from "@empireai/pillow";

function buildOfflineAudienceIntelligenceState(): AudienceIntelligenceState {
  const configuration = buildAudienceIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-AUD-001",
    missionId: "R5-08",
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
      totalAudiences: 0,
      averageQualityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      audiencesBuilt: 0,
      analysesRun: 0,
      overlapsDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Audience Intelligence snapshot when Pillow session is unavailable. */
export function collectAudienceIntelligenceSnapshot() {
  const engine = buildOfflineAudienceIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      audiencesBuilt: 0,
      averageQualityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as AudienceRunReport | null,
    audienceRecords: [],
  };
}
