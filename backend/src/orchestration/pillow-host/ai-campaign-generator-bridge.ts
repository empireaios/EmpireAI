import { buildAiCampaignGeneratorConfiguration } from "@empireai/pillow";
import type { AiCampaignGeneratorState, AiCampaignRunReport } from "@empireai/pillow";

function buildOfflineAiCampaignGeneratorState(): AiCampaignGeneratorState {
  const configuration = buildAiCampaignGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-ACG-001",
    missionId: "R5-12",
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
      totalCampaignsGenerated: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      campaignsGenerated: 0,
      strategiesGenerated: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback AI Campaign Generator snapshot when Pillow session is unavailable. */
export function collectAiCampaignGeneratorSnapshot() {
  const engine = buildOfflineAiCampaignGeneratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      campaignsGenerated: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as AiCampaignRunReport | null,
    campaignRecords: [],
  };
}
