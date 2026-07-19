import { buildBankingIntegrationConfiguration } from "@empireai/pillow";
import type {
  BankingIntegrationRunReport,
  BankingIntegrationState,
} from "@empireai/pillow";

function buildOfflineBankingIntegrationState(): BankingIntegrationState {
  const configuration = buildBankingIntegrationConfiguration();
  return {
    engineVersion: "PILLOW-BI-001",
    missionId: "R3-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    integrationRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      integrationEnabled: configuration.enabled,
      authenticationStatus: "unauthenticated",
      connectionStatus: "disconnected",
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      synchronizedAccounts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      authenticationAttempts: 0,
      accountSyncs: 0,
      balanceSyncs: 0,
      transactionSyncs: 0,
      notificationsHandled: 0,
      rateLimitedOperations: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Banking Integration snapshot when Pillow session is unavailable. */
export function collectBankingIntegrationSnapshot() {
  const engine = buildOfflineBankingIntegrationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      authenticationStatus: null,
      connectionStatus: null,
      operationalState: null,
      lastDecision: null,
      synchronizedAccounts: 0,
      frameworkRegistered: false,
      recentLogs: [],
    },
    latestReport: null as BankingIntegrationRunReport | null,
    bankingRecords: [],
    transactionRecords: [],
  };
}
