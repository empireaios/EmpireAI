import { buildPortfolioForecastEngineConfiguration } from "@empireai/pillow";
import type {
  PortfolioForecastEngineState,
  PortfolioForecastRunReport,
} from "@empireai/pillow";

function buildOfflinePortfolioForecastEngineState(): PortfolioForecastEngineState {
  const configuration = buildPortfolioForecastEngineConfiguration();
  return {
    engineVersion: "PILLOW-PFE-001",
    missionId: "X2-14",
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
      totalForecastRecords: 0,
      totalScenarios: 0,
      averageConfidence: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      revenueForecasts: 0,
      profitForecasts: 0,
      growthForecasts: 0,
      capitalForecasts: 0,
      customerGrowthForecasts: 0,
      supplierCapacityForecasts: 0,
      riskForecasts: 0,
      scenariosGenerated: 0,
      executiveForecasts: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Forecast Engine snapshot when Pillow session is unavailable. */
export function collectPortfolioForecastEngineSnapshot() {
  const engine = buildOfflinePortfolioForecastEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalForecastRecords: 0,
      totalScenarios: 0,
      averageConfidence: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as PortfolioForecastRunReport | null,
    forecastRecords: [],
  };
}
