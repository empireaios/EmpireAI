import { buildCampaignManagerConfiguration } from "@empireai/pillow";
import type { CampaignManagerState, CampaignRunReport } from "@empireai/pillow";

function buildOfflineCampaignManagerState(): CampaignManagerState {
  const configuration = buildCampaignManagerConfiguration();
  return {
    engineVersion: "PILLOW-CAM-001",
    missionId: "R5-07",
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
      totalCampaigns: 0,
      runningCampaigns: 0,
      failedCampaigns: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      campaignsCreated: 0,
      campaignsScheduled: 0,
      campaignsApproved: 0,
      coordinationsRun: 0,
      executionsTracked: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Campaign Manager snapshot when Pillow session is unavailable. */
export function collectCampaignManagerSnapshot() {
  const engine = buildOfflineCampaignManagerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      campaignsCreated: 0,
      runningCampaigns: 0,
      frameworkRegistered: false,
      channelsConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CampaignRunReport | null,
    campaignRecords: [],
  };
}
