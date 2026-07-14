import { buildUxScoringConfiguration } from "@empireai/pillow";
import type { UxScoringReport, UxScoringState } from "@empireai/pillow";

function buildOfflineScoringState(): UxScoringState {
  const configuration = buildUxScoringConfiguration();
  return {
    engineVersion: "PILLOW-UXS-001",
    missionId: "T2-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestRecord: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      scoringEnabled: configuration.enabled,
      scoresCompleted: 0,
      lastScoringAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalScorings: 0,
      successfulScorings: 0,
      failedScorings: 0,
      averageOverallScore: 0,
      averageScoringDurationMs: 0,
      peakScoringDurationMs: 0,
    },
  };
}

/** Fallback UX Scoring snapshot when Pillow session is unavailable. */
export function collectUxScoringSnapshot() {
  const engine = buildOfflineScoringState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-08",
    live: false,
    engine,
    cockpit: {
      scoringStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      overallUxScore: 0,
      passThreshold: engine.configuration.passThreshold,
      categoriesScored: 0,
      confidenceScore: 0,
      totalScorings: 0,
      recentLogs: [],
    },
    latestReport: null as UxScoringReport | null,
  };
}
