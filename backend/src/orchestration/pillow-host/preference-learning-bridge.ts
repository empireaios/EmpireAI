import { buildPreferenceLearningConfiguration } from "@empireai/pillow";
import type { PreferenceLearningRunReport, PreferenceLearningState } from "@empireai/pillow";

function buildOfflinePreferenceLearningState(): PreferenceLearningState {
  const configuration = buildPreferenceLearningConfiguration();
  return {
    engineVersion: "PILLOW-PL-001",
    missionId: "T4-08",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    learnedPreferences: [],
    currentPreferenceVersion: "pl-v1.0.0",
    health: {
      status: "standby",
      healthScore: 50,
      learningEnabled: configuration.enabled,
      learningSessionsCompleted: 0,
      lastLearningAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalLearningSessions: 0,
      successfulSessions: 0,
      failedSessions: 0,
      totalPreferencesLearned: 0,
      preferencesUpdated: 0,
      approvalSignalsProcessed: 0,
      conversationSignalsProcessed: 0,
      averageLearningDurationMs: 0,
      peakLearningDurationMs: 0,
    },
  };
}

/** Fallback Preference Learning snapshot when Pillow session is unavailable. */
export function collectPreferenceLearningSnapshot() {
  const engine = buildOfflinePreferenceLearningState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-08",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalLearningSessions: 0,
      preferencesLearned: 0,
      preferenceVersion: engine.currentPreferenceVersion,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as PreferenceLearningRunReport | null,
    learnedPreferences: [],
  };
}
