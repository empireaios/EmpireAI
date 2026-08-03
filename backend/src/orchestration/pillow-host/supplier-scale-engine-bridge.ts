import { buildSupplierScaleEngineConfiguration } from "@empireai/pillow";
import type {
  SupplierScaleEngineState,
  SseRunReport,
} from "@empireai/pillow";

function buildOfflineSupplierScaleEngineState(): SupplierScaleEngineState {
  const configuration = buildSupplierScaleEngineConfiguration();
  return {
    engineVersion: "PILLOW-SSE-001",
    missionId: "X3-06",
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
      totalScalingRecords: 0,
      bottleneckCount: 0,
      averageReadiness: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      scalingRisksDetected: 0,
      bottlenecksDetected: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Supplier Scale Engine snapshot when Pillow session is unavailable. */
export function collectSupplierScaleEngineSnapshot() {
  const engine = buildOfflineSupplierScaleEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalScalingRecords: 0,
      bottleneckCount: 0,
      averageReadiness: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as SseRunReport | null,
    scalingRecords: [],
    recommendations: [],
  };
}
