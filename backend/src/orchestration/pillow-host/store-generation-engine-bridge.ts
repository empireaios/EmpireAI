import { buildStoreGenerationEngineConfiguration } from "@empireai/pillow";
import type {
  StoreGenerationEngineState,
  StorefrontRunReport,
} from "@empireai/pillow";

function buildOfflineStoreGenerationEngineState(): StoreGenerationEngineState {
  const configuration = buildStoreGenerationEngineConfiguration();
  return {
    engineVersion: "PILLOW-SGE-001",
    missionId: "X1-07",
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
      totalStorefrontRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      storefrontsGenerated: 0,
      websiteStructureRuns: 0,
      navigationRuns: 0,
      catalogueRuns: 0,
      deploymentPackageRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Store Generation Engine snapshot when Pillow session is unavailable. */
export function collectStoreGenerationEngineSnapshot() {
  const engine = buildOfflineStoreGenerationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalStorefrontRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { StorefrontRunReport };
