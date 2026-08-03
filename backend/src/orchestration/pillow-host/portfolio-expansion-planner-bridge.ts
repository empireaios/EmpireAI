import { buildPortfolioExpansionPlannerConfiguration } from "@empireai/pillow";
import type {
  PortfolioExpansionPlannerState,
  PortfolioExpansionRunReport,
} from "@empireai/pillow";

function buildOfflinePortfolioExpansionPlannerState(): PortfolioExpansionPlannerState {
  const configuration = buildPortfolioExpansionPlannerConfiguration();
  return {
    engineVersion: "PILLOW-PEP-001",
    missionId: "X2-18",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalExpansionRecords: 0,
      highPriorityExpansions: 0,
      averageExpectedReturn: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      identifyOpportunitiesOps: 0,
      evaluateMarketsOps: 0,
      evaluateIndustriesOps: 0,
      evaluateInternalOps: 0,
      evaluateAcquisitionOps: 0,
      prioritizeOps: 0,
      estimateCostsOps: 0,
      estimateReturnsOps: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Portfolio Expansion Planner snapshot when Pillow session is unavailable. */
export function collectPortfolioExpansionPlannerSnapshot() {
  const engine = buildOfflinePortfolioExpansionPlannerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalExpansionRecords: 0,
      highPriorityExpansions: 0,
      averageExpectedReturn: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as PortfolioExpansionRunReport | null,
    expansionRecords: [],
  };
}
