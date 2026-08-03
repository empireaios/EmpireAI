import { buildAutonomousPortfolioBoardConfiguration } from "@empireai/pillow";
import type {
  AutonomousPortfolioBoardState,
  ExecutiveBoardRunReport,
} from "@empireai/pillow";

function buildOfflineAutonomousPortfolioBoardState(): AutonomousPortfolioBoardState {
  const configuration = buildAutonomousPortfolioBoardConfiguration();
  return {
    engineVersion: "PILLOW-APB-001",
    missionId: "X2-20",
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
      totalBoardRecords: 0,
      highConfidenceDecisions: 0,
      averageDecisionConfidence: 0,
      recommendationCount: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      performanceReviews: 0,
      healthReviews: 0,
      opportunityReviews: 0,
      riskReviews: 0,
      capitalReviews: 0,
      expansionReviews: 0,
      acquisitionReviews: 0,
      prioritizations: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Autonomous Portfolio Board snapshot when Pillow session is unavailable. */
export function collectAutonomousPortfolioBoardSnapshot() {
  const engine = buildOfflineAutonomousPortfolioBoardState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-20",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalBoardRecords: 0,
      highConfidenceDecisions: 0,
      averageDecisionConfidence: 0,
      recommendationCount: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as ExecutiveBoardRunReport | null,
    boardRecords: [],
  };
}
