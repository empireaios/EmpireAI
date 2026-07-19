import { buildMarketplaceHealthMonitorConfiguration } from "@empireai/pillow";
import type {
  MarketplaceHealthCheckReport,
  MarketplaceHealthMonitorState,
} from "@empireai/pillow";

const HEALTH_RECORD_SCHEMA_VERSION = "MHM-SCHEMA-001-v1";

function buildOfflineMarketplaceHealthMonitorState(): MarketplaceHealthMonitorState {
  const configuration = buildMarketplaceHealthMonitorConfiguration();
  return {
    engineVersion: "PILLOW-MHM-001",
    missionId: "R1-14",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      monitoredMarketplaces: 0,
      lastHealthCheckAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      checkFailures: 0,
      alertsActive: 0,
      failuresDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      healthCheckRuns: 0,
      marketplacesMonitored: 0,
      failuresDetected: 0,
      alertsGenerated: 0,
      degradedConnectorsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketplace Health Monitor snapshot when Pillow session is unavailable. */
export function collectMarketplaceHealthMonitorSnapshot() {
  const engine = buildOfflineMarketplaceHealthMonitorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-14",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      monitoredMarketplaces: 0,
      lastHealthCheckAt: null,
      lastDecision: null,
      failuresDetected: 0,
      alertsActive: 0,
      schemaVersion: HEALTH_RECORD_SCHEMA_VERSION,
      recentLogs: [],
    },
    latestReport: null as MarketplaceHealthCheckReport | null,
    records: [],
  };
}
