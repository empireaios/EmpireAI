import { buildGlobalExpansionFrameworkConfiguration } from "@empireai/pillow";
import type {
  GlobalExpansionFrameworkState,
  ExpansionFrameworkRunReport,
} from "@empireai/pillow";

function buildOfflineGlobalExpansionFrameworkState(): GlobalExpansionFrameworkState {
  const configuration = buildGlobalExpansionFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-GEF-001",
    missionId: "X4-01",
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
      dataAbstractions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Global Expansion Framework snapshot when Pillow session is unavailable. */
export function collectGlobalExpansionFrameworkSnapshot() {
  const engine = buildOfflineGlobalExpansionFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X4-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      registeredModules: 0,
      activeModules: 0,
      lastDecision: null,
      recentLogs: [],
    },
    latestReport: null as ExpansionFrameworkRunReport | null,
    registeredModules: [],
  };
}
