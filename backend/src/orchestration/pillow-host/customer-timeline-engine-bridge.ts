import { buildCustomerTimelineEngineConfiguration } from "@empireai/pillow";
import type { TimelineRunReport, CustomerTimelineEngineState } from "@empireai/pillow";

function buildOfflineCustomerTimelineEngineState(): CustomerTimelineEngineState {
  const configuration = buildCustomerTimelineEngineConfiguration();
  return {
    engineVersion: "PILLOW-CTE-001",
    missionId: "R4-03",
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
      totalTimelineRecords: 0,
      uniqueCustomers: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      eventsRecorded: 0,
      interactionsRecorded: 0,
      purchasesRecorded: 0,
      supportActivitiesRecorded: 0,
      communicationsRecorded: 0,
      accountChangesRecorded: 0,
      milestonesRecorded: 0,
      searchesPerformed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Customer Timeline Engine snapshot when Pillow session is unavailable. */
export function collectCustomerTimelineEngineSnapshot() {
  const engine = buildOfflineCustomerTimelineEngineState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-03",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalTimelineRecords: 0,
      uniqueCustomers: 0,
      identityEngineConnected: false,
      crmFoundationConnected: false,
      recentLogs: [],
    },
    latestReport: null as TimelineRunReport | null,
    timelineRecords: [],
  };
}
