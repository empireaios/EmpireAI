import { buildAdaptiveInterfaceConfiguration } from "@empireai/pillow";
import type {
  AdaptiveInterfaceRunReport,
  AdaptiveInterfaceState,
} from "@empireai/pillow";

function buildOfflineAdaptiveInterfaceState(): AdaptiveInterfaceState {
  const configuration = buildAdaptiveInterfaceConfiguration();
  return {
    engineVersion: "PILLOW-AIE-001",
    missionId: "T5-06",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    activeProfile: null,
    topAdaptations: [],
    health: {
      status: "standby",
      healthScore: 50,
      adaptationEnabled: configuration.enabled,
      continuousAdaptationActive: false,
      lastAdaptationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalAdaptationCycles: 0,
      successfulAdaptationCycles: 0,
      failedAdaptationCycles: 0,
      totalAdaptations: 0,
      layoutAdaptations: 0,
      navigationAdaptations: 0,
      workspaceAdaptations: 0,
      contextDetections: 0,
      duplicatesSkipped: 0,
      averageAdaptationDurationMs: 0,
      peakAdaptationDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Adaptive Interface snapshot when Pillow session is unavailable. */
export function collectAdaptiveInterfaceSnapshot() {
  const engine = buildOfflineAdaptiveInterfaceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousAdaptationActive: false,
      totalAdaptationCycles: 0,
      totalAdaptations: 0,
      topPriorityCount: 0,
      confidenceScore: 0,
      currentWorkflowContext: null,
      recentLogs: [],
    },
    latestReport: null as AdaptiveInterfaceRunReport | null,
    activeSession: null,
    activeProfile: null,
    topAdaptations: [],
  };
}
