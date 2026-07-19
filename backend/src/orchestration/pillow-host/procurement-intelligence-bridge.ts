import { buildProcurementIntelligenceConfiguration } from "@empireai/pillow";
import type { ProcurementIntelligenceState, ProcurementIntelligenceReport } from "@empireai/pillow";

function buildOfflineProcurementIntelligenceState(): ProcurementIntelligenceState {
  const configuration = buildProcurementIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-PI-001",
    missionId: "R2-19",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    records: [],
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      intelligenceRecordCount: 0,
      lastAnalyzeAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      analysisFailures: 0,
      anomaliesDetected: 0,
      recommendationsGenerated: 0,
      invalidRecordsDetected: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      analyzeRuns: 0,
      procurementsAnalyzed: 0,
      supplierEvaluations: 0,
      recommendationsGenerated: 0,
      anomaliesDetected: 0,
      costsOptimized: 0,
      analysisFailures: 0,
      invalidRecordsDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Procurement Intelligence snapshot when Pillow session is unavailable. */
export function collectProcurementIntelligenceSnapshot() {
  const engine = buildOfflineProcurementIntelligenceState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R2-19",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      intelligenceRecordCount: 0,
      lastAnalyzeAt: null,
      lastDecision: null,
      anomaliesDetected: 0,
      recommendationsGenerated: 0,
      costsOptimized: 0,
      recentLogs: [],
    },
    latestReport: null as ProcurementIntelligenceReport | null,
    records: [],
  };
}
