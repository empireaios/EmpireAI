import { buildCustomerSegmentationEngineConfiguration } from "@empireai/pillow";
import type {
  CustomerSegmentationEngineState,
  SegmentationRunReport,
} from "@empireai/pillow";

function buildOfflineCustomerSegmentationEngineState(): CustomerSegmentationEngineState {
  const configuration = buildCustomerSegmentationEngineConfiguration();
  return {
    engineVersion: "PILLOW-CSEG-001",
    missionId: "R4-16",
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
      totalSegmentationRecords: 0,
      activeSegments: 0,
      segmentChangesDetected: 0,
      failedRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      segmentsCreated: 0,
      assignmentsPerformed: 0,
      demographicSegmentations: 0,
      purchasingSegmentations: 0,
      valueSegmentations: 0,
      loyaltySegmentations: 0,
      sentimentSegmentations: 0,
      riskSegmentations: 0,
      changesDetected: 0,
      failuresDetected: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Segmentation snapshot when Pillow session is unavailable. */
export function collectCustomerSegmentationEngineSnapshot() {
  const engine = buildOfflineCustomerSegmentationEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-16",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalSegmentationRecords: 0,
      activeSegments: 0,
      segmentChangesDetected: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      recentLogs: [],
    },
    latestReport: null as SegmentationRunReport | null,
    segmentationRecords: [],
    segments: [],
    segmentChanges: [],
    failures: [],
  };
}
