import { buildCreativeAssetManagerConfiguration } from "@empireai/pillow";
import type { CreativeAssetManagerState, CreativeRunReport } from "@empireai/pillow";

function buildOfflineCreativeAssetManagerState(): CreativeAssetManagerState {
  const configuration = buildCreativeAssetManagerConfiguration();
  return {
    engineVersion: "PILLOW-CRA-001",
    missionId: "R5-11",
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
      totalAssets: 0,
      approvedAssets: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      assetsCreated: 0,
      versionsCreated: 0,
      approvalsProcessed: 0,
      usageEventsTracked: 0,
      searchesRun: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Creative Asset Manager snapshot when Pillow session is unavailable. */
export function collectCreativeAssetManagerSnapshot() {
  const engine = buildOfflineCreativeAssetManagerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalAssets: 0,
      approvedAssets: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [],
    },
    latestReport: null as CreativeRunReport | null,
    assetRecords: [],
  };
}
