import { buildContinuousUxEvolutionConfiguration } from "@empireai/pillow";
import type {
  ContinuousUxEvolutionRunReport,
  ContinuousUxEvolutionState,
} from "@empireai/pillow";

function buildOfflineContinuousUxEvolutionState(): ContinuousUxEvolutionState {
  const configuration = buildContinuousUxEvolutionConfiguration();
  return {
    engineVersion: "PILLOW-CUE-001",
    missionId: "T5-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    evolutionHistory: [],
    topImprovements: [],
    health: {
      status: "standby",
      healthScore: 50,
      evolutionEnabled: configuration.enabled,
      continuousEvolutionActive: false,
      lastEvolutionAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalEvolutionCycles: 0,
      successfulEvolutionCycles: 0,
      failedEvolutionCycles: 0,
      totalImprovements: 0,
      layoutEvolutions: 0,
      navigationEvolutions: 0,
      accessibilityEvolutions: 0,
      workflowEvolutions: 0,
      trendAnalyses: 0,
      duplicatesSkipped: 0,
      averageEvolutionDurationMs: 0,
      peakEvolutionDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Continuous UX Evolution snapshot when Pillow session is unavailable. */
export function collectContinuousUxEvolutionSnapshot() {
  const engine = buildOfflineContinuousUxEvolutionState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousEvolutionActive: false,
      totalEvolutionCycles: 0,
      totalImprovements: 0,
      topPriorityCount: 0,
      confidenceScore: 0,
      dominantEvolutionCategory: null,
      recentLogs: [],
    },
    latestReport: null as ContinuousUxEvolutionRunReport | null,
    activeSession: null,
    evolutionHistory: [],
    topImprovements: [],
  };
}
