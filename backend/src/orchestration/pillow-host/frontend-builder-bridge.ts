import { buildFrontendBuilderConfiguration } from "@empireai/pillow";
import type { FrontendBuilderState, FrontendBuildReport } from "@empireai/pillow";

function buildOfflineBuilderState(): FrontendBuilderState {
  const configuration = buildFrontendBuilderConfiguration();
  return {
    engineVersion: "PILLOW-FB-001",
    missionId: "T3-01",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      builderEnabled: configuration.enabled,
      buildsCompleted: 0,
      lastBuildAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalBuilds: 0,
      successfulBuilds: 0,
      failedBuilds: 0,
      totalRecordsGenerated: 0,
      averageRecordsPerBuild: 0,
      averageBuildDurationMs: 0,
      peakBuildDurationMs: 0,
    },
  };
}

/** Fallback Frontend Builder snapshot when Pillow session is unavailable. */
export function collectFrontendBuilderSnapshot() {
  const engine = buildOfflineBuilderState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-01",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      recordsCount: 0,
      validatedCount: 0,
      blockedCount: 0,
      confidenceScore: 0,
      totalBuilds: 0,
      recentLogs: [],
    },
    latestReport: null as FrontendBuildReport | null,
  };
}
