import { buildChangeDocumentationConfiguration } from "@empireai/pillow";
import type { ChangeDocumentationState, ChangeDocumentationRunReport } from "@empireai/pillow";

function buildOfflineChangeDocumentationState(): ChangeDocumentationState {
  const configuration = buildChangeDocumentationConfiguration();
  return {
    engineVersion: "PILLOW-CD-001",
    missionId: "T3-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      documentationEnabled: configuration.enabled,
      documentationsCompleted: 0,
      lastDocumentationAt: null,
      lastDocumentationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      recordsDocumentedTotal: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalDocumentations: 0,
      successfulDocumentations: 0,
      failedDocumentations: 0,
      totalRecordsDocumented: 0,
      averageRecordsPerRun: 0,
      averageDocumentationDurationMs: 0,
      peakDocumentationDurationMs: 0,
    },
  };
}

/** Fallback Change Documentation snapshot when Pillow session is unavailable. */
export function collectChangeDocumentationSnapshot() {
  const engine = buildOfflineChangeDocumentationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T3-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      recordsCount: 0,
      acceptedCount: 0,
      rejectedCount: 0,
      confidenceScore: 0,
      totalDocumentations: 0,
      recentLogs: [],
    },
    latestReport: null as ChangeDocumentationRunReport | null,
  };
}
