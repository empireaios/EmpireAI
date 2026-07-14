import { buildMarketplaceConnectorFrameworkConfiguration } from "@empireai/pillow";
import type {
  FrameworkRunReport,
  MarketplaceConnectorFrameworkState,
} from "@empireai/pillow";

function buildOfflineMarketplaceConnectorFrameworkState(): MarketplaceConnectorFrameworkState {
  const configuration = buildMarketplaceConnectorFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-MCF-001",
    missionId: "R1-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    registeredConnectors: [],
    health: {
      status: "standby",
      healthScore: 50,
      frameworkEnabled: configuration.enabled,
      registeredConnectors: 0,
      activeConnectors: 0,
      suspendedConnectors: 0,
      failedConnectors: 0,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      totalApiRequests: 0,
      rateLimitedRequests: 0,
      retriedRequests: 0,
      webhookEventsHandled: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Marketplace Connector Framework snapshot when Pillow session is unavailable. */
export function collectMarketplaceConnectorFrameworkSnapshot() {
  const engine = buildOfflineMarketplaceConnectorFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      registeredConnectorCount: 0,
      activeConnectorCount: 0,
      totalApiRequests: 0,
      rateLimitedRequests: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestReport: null as FrameworkRunReport | null,
    registeredConnectors: [],
  };
}
