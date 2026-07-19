import { buildRealWorldOperationsCertificationConfiguration } from "@empireai/pillow";
import type {
  RealWorldOperationsCertificationState,
  RealWorldOperationsCertificationReport,
} from "@empireai/pillow";

function buildOfflineRealWorldOperationsCertificationState(): RealWorldOperationsCertificationState {
  const configuration = buildRealWorldOperationsCertificationConfiguration();
  return {
    engineVersion: "PILLOW-RWOC-001",
    missionId: "R5-20",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      engineEnabled: configuration.enabled,
      lastCertificationAt: null,
      lastCertificationStatus: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      certificationFailures: 0,
      programmesCertified: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      certificationRuns: 0,
      programmesValidated: 0,
      programmesPassed: 0,
      programmesFailed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Real World Operations Certification snapshot when Pillow session is unavailable. */
export function collectRealWorldOperationsCertificationSnapshot() {
  const engine = buildOfflineRealWorldOperationsCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R5-20",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastCertificationAt: null,
      lastCertificationStatus: null,
      programmesCertified: 0,
      operationalReadinessScore: null,
      overallCertificationStatus: null,
      schemaVersion: "RWOC-SCHEMA-001-v1",
      recentLogs: [],
    },
    latestReport: null as RealWorldOperationsCertificationReport | null,
  };
}
