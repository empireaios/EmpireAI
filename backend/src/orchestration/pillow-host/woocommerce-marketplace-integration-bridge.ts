import { buildWooCommerceMarketplaceIntegrationConfiguration } from "@empireai/pillow";
import type {
  WooCommerceConnectorRunReport,
  WooCommerceMarketplaceIntegrationState,
} from "@empireai/pillow";

function buildOfflineWooCommerceMarketplaceIntegrationState(): WooCommerceMarketplaceIntegrationState {
  const configuration = buildWooCommerceMarketplaceIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-WOO-001",
    missionId: "R1-11",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    connectorRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      connectorEnabled: configuration.enabled,
      authenticationStatus: "unauthenticated",
      connectionStatus: "disconnected",
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
      authenticationAttempts: 0,
      connectionTests: 0,
      apiRequests: 0,
      webhooksProcessed: 0,
      rateLimitedRequests: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback WooCommerce Marketplace Integration snapshot when Pillow session is unavailable. */
export function collectWooCommerceMarketplaceIntegrationSnapshot() {
  const engine = buildOfflineWooCommerceMarketplaceIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-11",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      authenticationStatus: null,
      connectionStatus: null,
      operationalState: null,
      storeId: null,
      storeUrl: null,
      lastDecision: null,
      apiRequests: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as WooCommerceConnectorRunReport | null,
    connectorRecord: null,
  };
}
