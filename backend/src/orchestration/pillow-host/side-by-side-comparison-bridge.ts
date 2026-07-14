import { buildSideBySideComparisonConfiguration } from "@empireai/pillow";
import type {
  ComparisonRunReport,
  SideBySideComparisonState,
} from "@empireai/pillow";

function buildOfflineSideBySideComparisonState(): SideBySideComparisonState {
  const configuration = buildSideBySideComparisonConfiguration();
  return {
    engineVersion: "PILLOW-SBC-001",
    missionId: "T4-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      comparisonEnabled: configuration.enabled,
      comparisonsCompleted: 0,
      lastComparisonAt: null,
      lastComparisonDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalComparisons: 0,
      successfulComparisons: 0,
      failedComparisons: 0,
      totalOptionsCompared: 0,
      previewsLinked: 0,
      uxScoresCompared: 0,
      averageComparisonDurationMs: 0,
      peakComparisonDurationMs: 0,
    },
  };
}

/** Fallback Side-by-Side Comparison snapshot when Pillow session is unavailable. */
export function collectSideBySideComparisonSnapshot() {
  const engine = buildOfflineSideBySideComparisonState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-05",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalComparisons: 0,
      optionsCompared: 0,
      differenceMarkers: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ComparisonRunReport | null,
  };
}
