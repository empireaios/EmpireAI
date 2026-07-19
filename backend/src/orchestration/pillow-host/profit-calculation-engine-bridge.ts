import { buildProfitCalculationEngineConfiguration } from "@empireai/pillow";
import type {
  ProfitCalculationRunReport,
  ProfitCalculationEngineState,
} from "@empireai/pillow";

function buildOfflineProfitCalculationEngineState(): ProfitCalculationEngineState {
  const configuration = buildProfitCalculationEngineConfiguration();
  return {
    engineVersion: "PILLOW-PC-001",
    missionId: "R3-06",
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
      totalProfitRecords: 0,
      aggregateNetProfit: 0,
      aggregateProfitMargin: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      calculationsRun: 0,
      marketplaceCalculations: 0,
      supplierCalculations: 0,
      productCalculations: 0,
      orderCalculations: 0,
      aggregationsRun: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Profit Calculation Engine snapshot when Pillow session is unavailable. */
export function collectProfitCalculationEngineSnapshot() {
  const engine = buildOfflineProfitCalculationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalProfitRecords: 0,
      aggregateNetProfit: 0,
      aggregateProfitMargin: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as ProfitCalculationRunReport | null,
    profitRecords: [],
  };
}
