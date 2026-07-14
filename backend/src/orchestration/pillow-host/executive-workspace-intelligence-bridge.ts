import { buildExecutiveWorkspaceIntelligenceConfiguration } from "@empireai/pillow";
import type {
  ExecutiveWorkspaceIntelligenceRunReport,
  ExecutiveWorkspaceIntelligenceState,
} from "@empireai/pillow";

function buildOfflineExecutiveWorkspaceIntelligenceState(): ExecutiveWorkspaceIntelligenceState {
  const configuration = buildExecutiveWorkspaceIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-EWI-001",
    missionId: "T5-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    topRecommendations: [],
    health: {
      status: "standby",
      healthScore: 50,
      workspaceIntelligenceEnabled: configuration.enabled,
      continuousOptimizationActive: false,
      lastOptimizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOptimizationCycles: 0,
      successfulOptimizationCycles: 0,
      failedOptimizationCycles: 0,
      totalRecommendations: 0,
      dashboardRecommendations: 0,
      layoutRecommendations: 0,
      widgetRecommendations: 0,
      shortcutRecommendations: 0,
      missionAnalyses: 0,
      duplicatesSkipped: 0,
      averageOptimizationDurationMs: 0,
      peakOptimizationDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Executive Workspace Intelligence snapshot when Pillow session is unavailable. */
export function collectExecutiveWorkspaceIntelligenceSnapshot() {
  const engine = buildOfflineExecutiveWorkspaceIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousOptimizationActive: false,
      totalOptimizationCycles: 0,
      totalRecommendations: 0,
      topPriorityCount: 0,
      confidenceScore: 0,
      activeMissionContext: null,
      recentLogs: [],
    },
    latestReport: null as ExecutiveWorkspaceIntelligenceRunReport | null,
    activeSession: null,
    topRecommendations: [],
  };
}
