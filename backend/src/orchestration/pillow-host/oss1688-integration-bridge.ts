import { buildOss1688IntegrationConfiguration } from "@empireai/pillow";
import type {
  Oss1688ConnectorRunReport,
  Oss1688IntegrationState,
} from "@empireai/pillow";

function buildOfflineOss1688IntegrationState(): Oss1688IntegrationState {
  const configuration = buildOss1688IntegrationConfiguration();
  return {
    engineVersion: "PILLOW-1688-001",
    missionId: "R2-04",
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
      webhookEventsHandled: 0,
      rateLimitedRequests: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback 1688 Integration snapshot when Pillow session is unavailable. */
export function collectOss1688IntegrationSnapshot() {
  const engine = buildOfflineOss1688IntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      authenticationStatus: null,
      connectionStatus: null,
      operationalState: null,
      lastDecision: null,
      apiRequests: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as Oss1688ConnectorRunReport | null,
    connectorRecord: null,
  };
}
