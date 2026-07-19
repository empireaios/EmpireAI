import { buildFulfilmentOrchestratorConfiguration } from "@empireai/pillow";
import type { FulfilmentReport, FulfilmentOrchestratorState } from "@empireai/pillow";

function buildOfflineFulfilmentOrchestratorState(): FulfilmentOrchestratorState {
  const configuration = buildFulfilmentOrchestratorConfiguration();
  return {
    engineVersion: "PILLOW-FO-001",
    missionId: "R2-10",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      fulfilmentCount: 0,
      lastRoutingAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      routingFailures: 0,
      blockedWorkflows: 0,
      fulfilledCount: 0,
      invalidRequestsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      routingRuns: 0,
      ordersRouted: 0,
      fulfilmentsCompleted: 0,
      blockedWorkflowsDetected: 0,
      routingFailures: 0,
      invalidRequestsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Fulfilment Orchestrator snapshot when Pillow session is unavailable. */
export function collectFulfilmentOrchestratorSnapshot() {
  const engine = buildOfflineFulfilmentOrchestratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-10",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      fulfilmentCount: 0,
      lastRoutingAt: null,
      lastDecision: null,
      fulfilledCount: 0,
      blockedWorkflows: 0,
      routingFailures: 0,
      recentLogs: [],
    },
    latestReport: null as FulfilmentReport | null,
    records: [],
  };
}
