import { buildFinancialFrameworkConfiguration } from "@empireai/pillow";
import type {
  FrameworkRunReport as FinancialFrameworkRunReport,
  FinancialFrameworkState,
} from "@empireai/pillow";

function buildOfflineFinancialFrameworkState(): FinancialFrameworkState {
  const configuration = buildFinancialFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-FF-001",
    missionId: "R3-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    registeredModules: [],
    health: {
      status: "standby",
      healthScore: 50,
      frameworkEnabled: configuration.enabled,
      registeredModules: 0,
      activeModules: 0,
      suspendedModules: 0,
      failedModules: 0,
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
      totalEventsRouted: 0,
      rateLimitedEvents: 0,
      dataAbstractions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Financial Framework snapshot when Pillow session is unavailable. */
export function collectFinancialFrameworkSnapshot() {
  const engine = buildOfflineFinancialFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      registeredModuleCount: 0,
      activeModuleCount: 0,
      totalEventsRouted: 0,
      rateLimitedEvents: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestReport: null as FinancialFrameworkRunReport | null,
    registeredModules: [],
  };
}
