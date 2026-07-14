import { buildWorkflowEvolutionConfiguration } from "@empireai/pillow";
import type {
  WorkflowEvolutionRunReport,
  WorkflowEvolutionState,
} from "@empireai/pillow";

function buildOfflineWorkflowEvolutionState(): WorkflowEvolutionState {
  const configuration = buildWorkflowEvolutionConfiguration();
  return {
    engineVersion: "PILLOW-WFE-001",
    missionId: "T5-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    topRecommendations: [],
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
      totalRecommendations: 0,
      simplificationRecommendations: 0,
      navigationRecommendations: 0,
      accelerationRecommendations: 0,
      frictionDetections: 0,
      duplicatesSkipped: 0,
      averageEvolutionDurationMs: 0,
      peakEvolutionDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Workflow Evolution snapshot when Pillow session is unavailable. */
export function collectWorkflowEvolutionSnapshot() {
  const engine = buildOfflineWorkflowEvolutionState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousEvolutionActive: false,
      totalEvolutionCycles: 0,
      totalRecommendations: 0,
      topPriorityCount: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as WorkflowEvolutionRunReport | null,
    activeSession: null,
    topRecommendations: [],
  };
}
