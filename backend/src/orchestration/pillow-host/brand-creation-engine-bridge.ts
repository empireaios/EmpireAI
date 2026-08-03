import { buildBrandCreationEngineConfiguration } from "@empireai/pillow";
import type {
  BrandCreationEngineState,
  BrandRunReport,
} from "@empireai/pillow";

function buildOfflineBrandCreationEngineState(): BrandCreationEngineState {
  const configuration = buildBrandCreationEngineConfiguration();
  return {
    engineVersion: "PILLOW-BCE-001",
    missionId: "X1-05",
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
      totalBrandRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      brandsCreated: 0,
      namingRuns: 0,
      identityRuns: 0,
      guidelineRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Brand Creation Engine snapshot when Pillow session is unavailable. */
export function collectBrandCreationEngineSnapshot() {
  const engine = buildOfflineBrandCreationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBrandRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { BrandRunReport };
