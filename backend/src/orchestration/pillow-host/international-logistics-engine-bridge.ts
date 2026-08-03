import { buildInternationalLogisticsEngineConfiguration } from "@empireai/pillow";
import type {
  InternationalLogisticsEngineState,
  IleRunReport,
} from "@empireai/pillow";

function buildOfflineInternationalLogisticsEngineState(): InternationalLogisticsEngineState {
  const configuration = buildInternationalLogisticsEngineConfiguration();
  return {
    engineVersion: "PILLOW-ILE-001",
    missionId: "X4-08",
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
      totalLogisticsRecords: 0,
      bottleneckCount: 0,
      fulfillmentRiskCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      shippingNetworkOps: 0,
      providerMonitors: 0,
      performanceMonitors: 0,
      deliveryMonitors: 0,
      capacityMonitors: 0,
      costMonitors: 0,
      bottleneckDetections: 0,
      fulfillmentRiskDetections: 0,
      routeOptimizations: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback International Logistics Engine snapshot when Pillow session is unavailable. */
export function collectInternationalLogisticsEngineSnapshot() {
  const engine = buildOfflineInternationalLogisticsEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLogisticsRecords: 0,
      bottleneckCount: 0,
      fulfillmentRiskCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as IleRunReport | null,
    logisticsRecords: [],
    recommendations: [],
  };
}
