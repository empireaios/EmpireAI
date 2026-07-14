import { buildPreviewGeneratorConfiguration } from "@empireai/pillow";
import type { PreviewGeneratorState, PreviewGenerationReport } from "@empireai/pillow";

function buildOfflinePreviewState(): PreviewGeneratorState {
  const configuration = buildPreviewGeneratorConfiguration();
  return {
    engineVersion: "PILLOW-PG-001",
    missionId: "T3-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      generatorEnabled: configuration.enabled,
      previewsCompleted: 0,
      lastPreviewAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeEnvironments: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalPreviews: 0,
      successfulPreviews: 0,
      failedPreviews: 0,
      totalPreviewBuilds: 0,
      averageBuildsPerPreview: 0,
      averagePreviewDurationMs: 0,
      peakPreviewDurationMs: 0,
      cleanupsPerformed: 0,
    },
  };
}

/** Fallback Preview Generator snapshot when Pillow session is unavailable. */
export function collectPreviewGeneratorSnapshot() {
  const engine = buildOfflinePreviewState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      previewsCount: 0,
      validatedCount: 0,
      blockedCount: 0,
      activeEnvironments: 0,
      confidenceScore: 0,
      totalPreviews: 0,
      recentLogs: [],
    },
    latestReport: null as PreviewGenerationReport | null,
  };
}
