import { buildGoogleAdsIntegrationConfiguration } from "@empireai/pillow";
import type { GoogleAdsIntegrationState, GoogleAdsRunReport } from "@empireai/pillow";

function buildOfflineGoogleAdsIntegrationState(): GoogleAdsIntegrationState {
  const configuration = buildGoogleAdsIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-GAI-001",
    missionId: "R5-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      integrationEnabled: configuration.enabled,
      authenticationStatus: "unauthenticated",
      connectionStatus: "disconnected",
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalCampaigns: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      authenticationAttempts: 0,
      campaignsCreated: 0,
      adGroupsCreated: 0,
      advertisementsCreated: 0,
      performanceRetrievals: 0,
      statusSyncs: 0,
      rateLimitedOperations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Google Ads Integration snapshot when Pillow session is unavailable. */
export function collectGoogleAdsIntegrationSnapshot() {
  const engine = buildOfflineGoogleAdsIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      authenticationStatus: null,
      connectionStatus: null,
      operationalState: null,
      lastDecision: null,
      campaignsCreated: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as GoogleAdsRunReport | null,
    googleAdsRecords: [],
  };
}
