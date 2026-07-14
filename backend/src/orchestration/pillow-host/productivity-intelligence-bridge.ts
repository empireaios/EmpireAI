import { buildProductivityIntelligenceConfiguration } from "@empireai/pillow";
import type {
  ProductivityLearningRunReport,
  ProductivityIntelligenceState,
} from "@empireai/pillow";

function buildOfflineProductivityIntelligenceState(): ProductivityIntelligenceState {
  const configuration = buildProductivityIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-PIE-001",
    missionId: "T5-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    topPatterns: [],
    health: {
      status: "standby",
      healthScore: 50,
      learningEnabled: configuration.enabled,
      continuousLearningActive: false,
      lastLearningAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalLearningCycles: 0,
      successfulLearningCycles: 0,
      failedLearningCycles: 0,
      totalPatternsLearned: 0,
      workflowPatterns: 0,
      navigationPatterns: 0,
      bottleneckPatterns: 0,
      repetitionPatterns: 0,
      trendPatterns: 0,
      duplicatesSkipped: 0,
      averageLearningDurationMs: 0,
      peakLearningDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Productivity Intelligence snapshot when Pillow session is unavailable. */
export function collectProductivityIntelligenceSnapshot() {
  const engine = buildOfflineProductivityIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousLearningActive: false,
      totalLearningCycles: 0,
      totalPatternsLearned: 0,
      topConfidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ProductivityLearningRunReport | null,
    activeSession: null,
    topPatterns: [],
  };
}
