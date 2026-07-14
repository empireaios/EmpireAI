import { buildWorkflowOptimizationConfiguration } from "@empireai/pillow";
import type {
  WorkflowOptimizationReport,
  WorkflowOptimizationState,
} from "@empireai/pillow";

function buildOfflineOptimizationState(): WorkflowOptimizationState {
  const configuration = buildWorkflowOptimizationConfiguration();
  return {
    engineVersion: "PILLOW-WFO-001",
    missionId: "T2-05",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestRecord: null,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      optimizationEnabled: configuration.enabled,
      analysesCompleted: 0,
      lastAnalysisAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalAnalyses: 0,
      successfulAnalyses: 0,
      failedAnalyses: 0,
      totalFrictionPoints: 0,
      totalStrengthsIdentified: 0,
      averageAnalysisDurationMs: 0,
      peakAnalysisDurationMs: 0,
    },
  };
}

/** Fallback Workflow Optimization snapshot when Pillow session is unavailable. */
export function collectWorkflowOptimizationSnapshot() {
  const engine = buildOfflineOptimizationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-05",
    live: false,
    engine,
    cockpit: {
      optimizationStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      frictionPointsCount: 0,
      strengthsCount: 0,
      workflowName: null,
      confidenceScore: 0,
      totalAnalyses: 0,
      recentLogs: [],
    },
    latestReport: null as WorkflowOptimizationReport | null,
  };
}
