import { buildWinningProductDetectorConfiguration } from "@empireai/pillow";
import type {
  WinningProductDetectorState,
  WpdRunReport,
} from "@empireai/pillow";

function buildOfflineWinningProductDetectorState(): WinningProductDetectorState {
  const configuration = buildWinningProductDetectorConfiguration();
  return {
    engineVersion: "PILLOW-WPD-001",
    missionId: "X3-02",
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
      totalProductRecords: 0,
      breakoutCount: 0,
      decliningCount: 0,
      averageScalingPotential: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      performanceMonitors: 0,
      velocityAnalyses: 0,
      demandAnalyses: 0,
      trendAnalyses: 0,
      breakoutDetections: 0,
      decliningDetections: 0,
      rankingsRun: 0,
      recommendationsGenerated: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Winning Product Detector snapshot when Pillow session is unavailable. */
export function collectWinningProductDetectorSnapshot() {
  const engine = buildOfflineWinningProductDetectorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X3-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalProductRecords: 0,
      breakoutCount: 0,
      decliningCount: 0,
      averageScalingPotential: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as WpdRunReport | null,
    productRecords: [],
    recommendations: [],
  };
}
