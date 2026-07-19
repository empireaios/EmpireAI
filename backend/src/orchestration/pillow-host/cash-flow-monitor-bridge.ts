import { buildCashFlowMonitorConfiguration } from "@empireai/pillow";
import type {
  CashFlowMonitorRunReport,
  CashFlowMonitorState,
} from "@empireai/pillow";

function buildOfflineCashFlowMonitorState(): CashFlowMonitorState {
  const configuration = buildCashFlowMonitorConfiguration();
  return {
    engineVersion: "PILLOW-CF-001",
    missionId: "R3-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    monitorRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      monitorEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalCashFlowRecords: 0,
      currentLiquidityStatus: null,
      aggregateNetCashFlow: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      monitoringRuns: 0,
      inflowMonitoringRuns: 0,
      outflowMonitoringRuns: 0,
      liquidityChecks: 0,
      forecastsGenerated: 0,
      aggregationsRun: 0,
      anomaliesDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Cash Flow Monitor snapshot when Pillow session is unavailable. */
export function collectCashFlowMonitorSnapshot() {
  const engine = buildOfflineCashFlowMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalCashFlowRecords: 0,
      currentLiquidityStatus: null,
      aggregateNetCashFlow: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as CashFlowMonitorRunReport | null,
    cashFlowRecords: [],
  };
}
