import { buildMultiCurrencyEngineConfiguration } from "@empireai/pillow";
import type {
  MultiCurrencyRunReport,
  MultiCurrencyEngineState,
} from "@empireai/pillow";

function buildOfflineMultiCurrencyEngineState(): MultiCurrencyEngineState {
  const configuration = buildMultiCurrencyEngineConfiguration();
  return {
    engineVersion: "PILLOW-MC-001",
    missionId: "R3-12",
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
      totalCurrencyRecords: 0,
      aggregateConvertedAmount: 0,
      lastConversionStatus: null,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      conversionsPerformed: 0,
      exchangeRatesRefreshed: 0,
      gainLossCalculations: 0,
      summariesGenerated: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Multi-Currency Engine snapshot when Pillow session is unavailable. */
export function collectMultiCurrencyEngineSnapshot() {
  const engine = buildOfflineMultiCurrencyEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-12",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCurrencyRecords: 0,
      aggregateConvertedAmount: 0,
      lastConversionStatus: null,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as MultiCurrencyRunReport | null,
    currencyRecords: [],
    exchangeRateHistory: [],
  };
}
