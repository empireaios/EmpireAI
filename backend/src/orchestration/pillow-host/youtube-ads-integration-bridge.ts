import { buildYouTubeAdsIntegrationConfiguration } from "@empireai/pillow";
import type { YouTubeAdsIntegrationState, YouTubeAdsRunReport } from "@empireai/pillow";

function buildOfflineYouTubeAdsIntegrationState(): YouTubeAdsIntegrationState {
  const configuration = buildYouTubeAdsIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-YAI-001",
    missionId: "R5-05",
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
      totalVideoAssets: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      authenticationAttempts: 0,
      campaignsCreated: 0,
      adGroupsCreated: 0,
      videoAdvertisementsCreated: 0,
      videoAssetsManaged: 0,
      performanceRetrievals: 0,
      statusSyncs: 0,
      rateLimitedOperations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback YouTube Ads Integration snapshot when Pillow session is unavailable. */
export function collectYouTubeAdsIntegrationSnapshot() {
  const engine = buildOfflineYouTubeAdsIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-05",
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
      videoAssetsManaged: 0,
      frameworkRegistered: false,
      googleAdsDependencyPresent: false,
      recentLogs: [],
    },
    latestReport: null as YouTubeAdsRunReport | null,
    youtubeAdsRecords: [],
  };
}
