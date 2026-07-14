import { buildExplainDecisionsConfiguration } from "@empireai/pillow";
import type {
  ExplanationRunReport,
  ExplainDecisionsState,
} from "@empireai/pillow";

function buildOfflineExplainDecisionsState(): ExplainDecisionsState {
  const configuration = buildExplainDecisionsConfiguration();
  return {
    engineVersion: "PILLOW-ED-001",
    missionId: "T4-06",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      explanationEnabled: configuration.enabled,
      explanationsCompleted: 0,
      lastExplanationAt: null,
      lastExplanationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalExplanations: 0,
      successfulExplanations: 0,
      failedExplanations: 0,
      evidenceLinked: 0,
      tradeoffsAnalyzed: 0,
      weakEvidenceWarnings: 0,
      averageExplanationDurationMs: 0,
      peakExplanationDurationMs: 0,
    },
  };
}

/** Fallback Explain Decisions snapshot when Pillow session is unavailable. */
export function collectExplainDecisionsSnapshot() {
  const engine = buildOfflineExplainDecisionsState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalExplanations: 0,
      evidenceLinked: 0,
      confidenceScore: 0,
      weakEvidenceWarnings: 0,
      recentLogs: [],
    },
    latestReport: null as ExplanationRunReport | null,
  };
}
