import { buildPricingStrategyEngineConfiguration } from "@empireai/pillow";
import type {
  PricingStrategyEngineState,
  PricingRunReport,
} from "@empireai/pillow";

function buildOfflinePricingStrategyEngineState(): PricingStrategyEngineState {
  const configuration = buildPricingStrategyEngineConfiguration();
  return {
    engineVersion: "PILLOW-PSE-001",
    missionId: "X1-09",
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
      totalPricingRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      strategiesGenerated: 0,
      priceCalculationRuns: 0,
      marginRuns: 0,
      competitorAnalysisRuns: 0,
      recommendationRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Pricing Strategy Engine snapshot when Pillow session is unavailable. */
export function collectPricingStrategyEngineSnapshot() {
  const engine = buildOfflinePricingStrategyEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPricingRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { PricingRunReport };
