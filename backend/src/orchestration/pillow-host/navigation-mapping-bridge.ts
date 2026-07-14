import { buildNavigationMappingConfiguration } from "@empireai/pillow";
import type { NavigationMappingState, NavigationGraph } from "@empireai/pillow";

function buildOfflineNavigationMappingState(): NavigationMappingState {
  const configuration = buildNavigationMappingConfiguration();
  return {
    engineVersion: "PILLOW-NME-001",
    missionId: "T1-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    activeSession: null,
    latestGraph: null,
    previousGraph: null,
    cumulativeGraph: null,
    health: {
      status: "standby",
      healthScore: 50,
      mappingEnabled: configuration.enabled,
      isMapping: false,
      lastSuccessfulGraphAt: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      averageProcessingDurationMs: 0,
      graphsPerMinute: 0,
      backlogSize: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalMappings: 0,
      successfulMappings: 0,
      failedMappings: 0,
      totalNodes: 0,
      totalEdges: 0,
      totalTransitions: 0,
      averageProcessingDurationMs: 0,
      peakProcessingDurationMs: 0,
      skippedLayouts: 0,
      uptimeMs: 0,
    },
  };
}

/** Fallback Navigation Mapping snapshot when Pillow session is unavailable. */
export function collectNavigationMappingSnapshot() {
  const engine = buildOfflineNavigationMappingState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T1-05",
    live: false,
    engine,
    cockpit: {
      mappingStatus: engine.status,
      healthStatus: engine.health.status,
      graphsGenerated: 0,
      nodesMapped: 0,
      edgesMapped: 0,
      currentScreenId: null,
      currentRouteId: null,
      latestGraphTimestamp: null,
      transitionDetected: false,
      confidenceScore: 0,
      recoveryAttempts: 0,
      recentLogs: [],
    },
    latestGraph: null as NavigationGraph | null,
    cumulativeGraph: null as NavigationGraph | null,
  };
}
