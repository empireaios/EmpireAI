import { buildExecutiveStyleLearningConfiguration } from "@empireai/pillow";
import type {
  ExecutiveStyleLearningReport,
  ExecutiveStyleLearningState,
} from "@empireai/pillow";

function buildOfflineLearningState(): ExecutiveStyleLearningState {
  const configuration = buildExecutiveStyleLearningConfiguration();
  return {
    engineVersion: "PILLOW-ESL-001",
    missionId: "T2-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestModel: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      learningEnabled: configuration.enabled,
      preferencesLearned: 0,
      lastLearningAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalLearningRuns: 0,
      successfulLearningRuns: 0,
      failedLearningRuns: 0,
      totalApprovals: 0,
      totalRejections: 0,
      totalPreferencesLearned: 0,
      averageLearningDurationMs: 0,
      peakLearningDurationMs: 0,
    },
  };
}

/** Fallback Executive Style Learning snapshot when Pillow session is unavailable. */
export function collectExecutiveStyleLearningSnapshot() {
  const engine = buildOfflineLearningState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-03",
    live: false,
    engine,
    cockpit: {
      learningStatus: engine.status,
      healthStatus: engine.health.status,
      preferenceModelVersion: null,
      preferencesLearned: 0,
      confidenceScore: 0,
      lastDecision: null,
      totalApprovals: 0,
      totalRejections: 0,
      recentLogs: [],
    },
    latestReport: null as ExecutiveStyleLearningReport | null,
  };
}
