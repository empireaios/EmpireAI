import { buildRecommendationEngineConfiguration } from "@empireai/pillow";
import type { RecommendationReport, RecommendationEngineState } from "@empireai/pillow";

function buildOfflineRecommendationState(): RecommendationEngineState {
  const configuration = buildRecommendationEngineConfiguration();
  return {
    engineVersion: "PILLOW-REC-001",
    missionId: "T2-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestRecord: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      recommendationEnabled: configuration.enabled,
      reportsGenerated: 0,
      lastReportAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalReports: 0,
      successfulReports: 0,
      failedReports: 0,
      totalProposalsGenerated: 0,
      averageProposalsPerReport: 0,
      averageReportDurationMs: 0,
      peakReportDurationMs: 0,
    },
  };
}

/** Fallback Recommendation Engine snapshot when Pillow session is unavailable. */
export function collectRecommendationEngineSnapshot() {
  const engine = buildOfflineRecommendationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      proposalsCount: 0,
      criticalCount: 0,
      highPriorityCount: 0,
      confidenceScore: 0,
      totalReports: 0,
      recentLogs: [],
    },
    latestReport: null as RecommendationReport | null,
  };
}
