import { buildComponentGeneratorConfiguration } from "@empireai/pillow";
import type {
  ComponentGeneratorState,
  ComponentGenerationReport,
} from "@empireai/pillow";

function buildOfflineGeneratorState(): ComponentGeneratorState {
  const configuration = buildComponentGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-CG-001",
    missionId: "T3-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      generatorEnabled: configuration.enabled,
      generationsCompleted: 0,
      lastGenerationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalGenerations: 0,
      successfulGenerations: 0,
      failedGenerations: 0,
      totalComponentsGenerated: 0,
      duplicatesSkipped: 0,
      averageComponentsPerGeneration: 0,
      averageGenerationDurationMs: 0,
      peakGenerationDurationMs: 0,
    },
  };
}

/** Fallback Component Generator snapshot when Pillow session is unavailable. */
export function collectComponentGeneratorSnapshot() {
  const engine = buildOfflineGeneratorState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      componentsCount: 0,
      validatedCount: 0,
      blockedCount: 0,
      duplicatesSkipped: 0,
      confidenceScore: 0,
      totalGenerations: 0,
      recentLogs: [],
    },
    latestReport: null as ComponentGenerationReport | null,
  };
}
