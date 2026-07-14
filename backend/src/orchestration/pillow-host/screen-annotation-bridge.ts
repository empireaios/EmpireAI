import { buildScreenAnnotationConfiguration } from "@empireai/pillow";
import type { ScreenAnnotationState, AnnotationRunReport } from "@empireai/pillow";

function buildOfflineScreenAnnotationState(): ScreenAnnotationState {
  const configuration = buildScreenAnnotationConfiguration();
  return {
    engineVersion: "PILLOW-SA-001",
    missionId: "T4-03",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      annotationEnabled: configuration.enabled,
      annotationsCompleted: 0,
      lastAnnotationAt: null,
      lastAnnotationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalAnnotations: 0,
      successfulAnnotations: 0,
      failedAnnotations: 0,
      totalIntentsGenerated: 0,
      clarificationsRequested: 0,
      uxFindingsLinked: 0,
      averageAnnotationDurationMs: 0,
      peakAnnotationDurationMs: 0,
    },
  };
}

/** Fallback Screen Annotation snapshot when Pillow session is unavailable. */
export function collectScreenAnnotationSnapshot() {
  const engine = buildOfflineScreenAnnotationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalAnnotations: 0,
      intentsGenerated: 0,
      clarificationsPending: 0,
      confidenceScore: 0,
      uxFindingsLinked: 0,
      recentLogs: [],
    },
    latestReport: null as AnnotationRunReport | null,
  };
}
