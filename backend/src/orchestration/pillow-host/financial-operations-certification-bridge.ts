import { buildFinancialOperationsCertificationConfiguration } from "@empireai/pillow";
import type {
  FinancialOperationsCertificationReport,
  FinancialOperationsCertificationState,
} from "@empireai/pillow";

const CERTIFICATION_SCHEMA_VERSION = "FOC-SCHEMA-001-v1";

function buildOfflineFinancialOperationsCertificationState(): FinancialOperationsCertificationState {
  const configuration = buildFinancialOperationsCertificationConfiguration();
  return {
    engineVersion: "PILLOW-FOC-001",
    missionId: "R3-18",
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
      missionsCertified: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      certificationRuns: 0,
      missionsValidated: 0,
      missionsPassed: 0,
      missionsFailed: 0,
      retryAttempts: 0,
      averageOperationDurationMs: 0,
      peakOperationDurationMs: 0,
    },
  };
}

/** Fallback Financial Operations Certification snapshot when Pillow session is unavailable. */
export function collectFinancialOperationsCertificationSnapshot() {
  const engine = buildOfflineFinancialOperationsCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R3-18",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastCertificationAt: null,
      lastCertificationStatus: null,
      missionsCertified: 0,
      overallCertificationStatus: null,
      schemaVersion: CERTIFICATION_SCHEMA_VERSION,
      recentLogs: [],
    },
    latestReport: null as FinancialOperationsCertificationReport | null,
    certifiedMissions: [],
  };
}
