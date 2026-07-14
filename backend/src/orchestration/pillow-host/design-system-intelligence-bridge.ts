import { buildDesignSystemIntelligenceConfiguration } from "@empireai/pillow";
import type {
  DesignSystemAnalysisReport,
  DesignSystemIntelligenceState,
} from "@empireai/pillow";

function buildOfflineIntelligenceState(): DesignSystemIntelligenceState {
  const configuration = buildDesignSystemIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-DSI-001",
    missionId: "T2-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestModel: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      intelligenceEnabled: configuration.enabled,
      lastAnalysisAt: null,
      lastValidationDecision: null,
      componentsLearned: 0,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      totalComponentsDiscovered: 0,
      totalDeviationsDetected: 0,
      averageAnalysisDurationMs: 0,
      peakAnalysisDurationMs: 0,
    },
  };
}

/** Fallback Design System Intelligence snapshot when Pillow session is unavailable. */
export function collectDesignSystemIntelligenceSnapshot() {
  const engine = buildOfflineIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-02",
    live: false,
    engine,
    cockpit: {
      intelligenceStatus: engine.status,
      healthStatus: engine.health.status,
      designSystemVersion: null,
      componentsLearned: 0,
      familiesIdentified: 0,
      lastDecision: null,
      deviationsCount: 0,
      totalAnalyses: 0,
      recentLogs: [],
    },
    latestReport: null as DesignSystemAnalysisReport | null,
  };
}
