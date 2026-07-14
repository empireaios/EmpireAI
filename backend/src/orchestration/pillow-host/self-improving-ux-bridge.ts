import { buildSelfImprovingUxConfiguration } from "@empireai/pillow";
import type {
  SelfImprovingUxRunReport,
  SelfImprovingUxState,
} from "@empireai/pillow";

function buildOfflineSelfImprovingUxState(): SelfImprovingUxState {
  const configuration = buildSelfImprovingUxConfiguration();
  return {
    engineVersion: "PILLOW-SIUX-001",
    missionId: "T5-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    knowledgeBase: [],
    topLearnings: [],
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
      knowledgeBaseSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalLearningCycles: 0,
      successfulLearningCycles: 0,
      failedLearningCycles: 0,
      totalInsights: 0,
      redesignLearnings: 0,
      approvalLearnings: 0,
      deploymentLearnings: 0,
      recommendationImprovements: 0,
      prioritizationImprovements: 0,
      knowledgeBaseUpdates: 0,
      duplicatesSkipped: 0,
      averageLearningDurationMs: 0,
      peakLearningDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Self-Improving UX snapshot when Pillow session is unavailable. */
export function collectSelfImprovingUxSnapshot() {
  const engine = buildOfflineSelfImprovingUxState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousLearningActive: false,
      totalLearningCycles: 0,
      totalInsights: 0,
      knowledgeBaseSize: 0,
      confidenceScore: 0,
      dominantLearningCategory: null,
      recentLogs: [],
    },
    latestReport: null as SelfImprovingUxRunReport | null,
    activeSession: null,
    knowledgeBase: [],
    topLearnings: [],
  };
}
