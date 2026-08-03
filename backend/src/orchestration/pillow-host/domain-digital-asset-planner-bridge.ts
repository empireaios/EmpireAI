import { buildDomainDigitalAssetPlannerConfiguration } from "@empireai/pillow";
import type {
  DomainDigitalAssetPlannerState,
  DigitalAssetRunReport,
} from "@empireai/pillow";

function buildOfflineDomainDigitalAssetPlannerState(): DomainDigitalAssetPlannerState {
  const configuration = buildDomainDigitalAssetPlannerConfiguration();
  return {
    engineVersion: "PILLOW-DAP-001",
    missionId: "X1-06",
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
      totalPlanRecords: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      plansCreated: 0,
      domainPlanningRuns: 0,
      socialPlanningRuns: 0,
      websitePlanningRuns: 0,
      conflictDetectionRuns: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Domain & Digital Asset Planner snapshot when Pillow session is unavailable. */
export function collectDomainDigitalAssetPlannerSnapshot() {
  const engine = buildOfflineDomainDigitalAssetPlannerState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "X1-06",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      operationalState: null,
      lastDecision: null,
      totalPlanRecords: 0,
      frameworkRegistered: false,
      dependenciesConnected: 0,
      recentLogs: [] as string[],
    },
  };
}

export type { DigitalAssetRunReport };
