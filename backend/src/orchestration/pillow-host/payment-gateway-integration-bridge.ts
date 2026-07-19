import { buildPaymentGatewayIntegrationConfiguration } from "@empireai/pillow";
import type {
  PaymentGatewayRunReport,
  PaymentGatewayIntegrationState,
} from "@empireai/pillow";

function buildOfflinePaymentGatewayIntegrationState(): PaymentGatewayIntegrationState {
  const configuration = buildPaymentGatewayIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-PG-001",
    missionId: "R3-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    gatewayRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      gatewayEnabled: configuration.enabled,
      authenticationStatus: "unauthenticated",
      connectionStatus: "disconnected",
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalPayments: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      authenticationAttempts: 0,
      paymentRequests: 0,
      authorizations: 0,
      captures: 0,
      cancellations: 0,
      webhookEventsHandled: 0,
      statusSyncs: 0,
      rateLimitedOperations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Payment Gateway Integration snapshot when Pillow session is unavailable. */
export function collectPaymentGatewayIntegrationSnapshot() {
  const engine = buildOfflinePaymentGatewayIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      authenticationStatus: null,
      connectionStatus: null,
      operationalState: null,
      lastDecision: null,
      paymentRequests: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as PaymentGatewayRunReport | null,
    paymentRecords: [],
  };
}
