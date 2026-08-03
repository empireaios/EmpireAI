import { buildEnterprisePortfolioFrameworkConfiguration } from "@empireai/pillow";
import type {
  EnterprisePortfolioFrameworkRunReport,
  EnterprisePortfolioFrameworkState,
} from "@empireai/pillow";

function buildOfflineEnterprisePortfolioFrameworkState(): EnterprisePortfolioFrameworkState {
  const configuration = buildEnterprisePortfolioFrameworkConfiguration();
  return {
    engineVersion: "PILLOW-EPF-001",
    missionId: "X2-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    registeredModules: [],
    registeredCompanies: [],
    health: {
      status: "standby",
      healthScore: 50,
      frameworkEnabled: configuration.enabled,
      registeredModules: 0,
      activeModules: 0,
      registeredCompanies: 0,
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
      companiesRegistered: 0,
      dataAbstractions: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Enterprise Portfolio Framework snapshot when Pillow session is unavailable. */
export function collectEnterprisePortfolioFrameworkSnapshot() {
  const engine = buildOfflineEnterprisePortfolioFrameworkState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      registeredModules: 0,
      registeredCompanies: 0,
      activeModules: 0,
      lastDecision: null,
      recentLogs: [],
    },
    latestReport: null as EnterprisePortfolioFrameworkRunReport | null,
    registeredModules: [],
    registeredCompanies: [],
  };
}
