import { buildCurrencyIntelligenceConfiguration } from "@empireai/pillow";
import type {
  CurrencyIntelligenceEngineState,
  CurRunReport,
} from "@empireai/pillow";

function buildOfflineCurrencyIntelligenceState(): CurrencyIntelligenceEngineState {
  const configuration = buildCurrencyIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-CUR-001",
    missionId: "X4-05",
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
      anomalyCount: 0,
      averageFluctuationPercent: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      currencyManagementOps: 0,
      preferenceDetections: 0,
      conversions: 0,
      exchangeRateRefreshes: 0,
      fluctuationMonitors: 0,
      regionalPricingOps: 0,
      anomalyDetections: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Currency Intelligence snapshot when Pillow session is unavailable. */
export function collectCurrencyIntelligenceSnapshot() {
  const engine = buildOfflineCurrencyIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCurrencyRecords: 0,
      anomalyCount: 0,
      averageFluctuationPercent: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CurRunReport | null,
    currencyRecords: [],
    recommendations: [],
  };
}
