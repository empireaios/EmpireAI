import { buildCompanyLifecycleManagerConfiguration } from "@empireai/pillow";
import type {
  CompanyLifecycleManagerState,
  CompanyLifecycleRunReport,
} from "@empireai/pillow";

function buildOfflineCompanyLifecycleManagerState(): CompanyLifecycleManagerState {
  const configuration = buildCompanyLifecycleManagerConfiguration();
  return {
    engineVersion: "PILLOW-CLM-001",
    missionId: "X2-17",
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
      totalLifecycleRecords: 0,
      pendingTransitions: 0,
      averageMaturityScore: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      stageManagementOps: 0,
      maturityAssessments: 0,
      transitionsDetected: 0,
      launchOps: 0,
      growthOps: 0,
      matureOps: 0,
      retirementOps: 0,
      recommendationsGenerated: 0,
      analyticsRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Company Lifecycle Manager snapshot when Pillow session is unavailable. */
export function collectCompanyLifecycleManagerSnapshot() {
  const engine = buildOfflineCompanyLifecycleManagerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X2-17",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalLifecycleRecords: 0,
      pendingTransitions: 0,
      averageMaturityScore: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
    latestReport: null as CompanyLifecycleRunReport | null,
    lifecycleRecords: [],
  };
}
