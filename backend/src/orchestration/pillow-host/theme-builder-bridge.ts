import { buildThemeBuilderConfiguration } from "@empireai/pillow";
import type { ThemeBuilderState, ThemeGenerationReport } from "@empireai/pillow";

function buildOfflineThemeBuilderState(): ThemeBuilderState {
  const configuration = buildThemeBuilderConfiguration();
  return {
    engineVersion: "PILLOW-TB-001",
    missionId: "T3-04",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      builderEnabled: configuration.enabled,
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
      totalThemesGenerated: 0,
      averageThemesPerGeneration: 0,
      averageGenerationDurationMs: 0,
      peakGenerationDurationMs: 0,
    },
  };
}

/** Fallback Theme Builder snapshot when Pillow session is unavailable. */
export function collectThemeBuilderSnapshot() {
  const engine = buildOfflineThemeBuilderState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-04",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      themesCount: 0,
      validatedCount: 0,
      blockedCount: 0,
      confidenceScore: 0,
      totalGenerations: 0,
      recentLogs: [],
    },
    latestReport: null as ThemeGenerationReport | null,
  };
}
