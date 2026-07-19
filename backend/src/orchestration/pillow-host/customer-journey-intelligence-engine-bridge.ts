import { buildCustomerJourneyIntelligenceConfiguration } from "@empireai/pillow";
import type {
  CustomerJourneyIntelligenceState,
  JourneyRunReport,
} from "@empireai/pillow";

function buildOfflineCustomerJourneyIntelligenceEngineState(): CustomerJourneyIntelligenceState {
  const configuration = buildCustomerJourneyIntelligenceConfiguration();
  return {
    engineVersion: "PILLOW-CJI-001",
    missionId: "R4-17",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    engineRecord: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastOperationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      totalJourneyRecords: 0,
      activeInsights: 0,
      dropOffDetected: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      journeysMapped: 0,
      touchpointsTracked: 0,
      stagesIdentified: 0,
      dropOffsDetected: 0,
      frictionPointsDetected: 0,
      performanceMeasurements: 0,
      conversionMeasurements: 0,
      recommendationsGenerated: 0,
      predictionsGenerated: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Journey Intelligence snapshot when Pillow session is unavailable. */
export function collectCustomerJourneyIntelligenceEngineSnapshot() {
  const engine = buildOfflineCustomerJourneyIntelligenceEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalJourneyRecords: 0,
      activeInsights: 0,
      dropOffDetected: 0,
      identityEngineConnected: false,
      timelineEngineConnected: false,
      recentLogs: [],
    },
    latestReport: null as JourneyRunReport | null,
    journeyRecords: [],
    insights: [],
    failures: [],
  };
}
