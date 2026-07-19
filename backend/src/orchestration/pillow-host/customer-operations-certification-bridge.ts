import { buildCustomerOperationsCertificationConfiguration } from "@empireai/pillow";
import type {
  CustomerOperationsCertificationReport,
  CustomerOperationsCertificationState,
} from "@empireai/pillow";

const CERTIFICATION_SCHEMA_VERSION = "COC-SCHEMA-001-v1";

function buildOfflineCustomerOperationsCertificationState(): CustomerOperationsCertificationState {
  const configuration = buildCustomerOperationsCertificationConfiguration();
  return {
    engineVersion: "PILLOW-COC-001",
    missionId: "R4-19",
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

/** Fallback Customer Operations Certification snapshot when Pillow session is unavailable. */
export function collectCustomerOperationsCertificationSnapshot() {
  const engine = buildOfflineCustomerOperationsCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R4-19",
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
    latestReport: null as CustomerOperationsCertificationReport | null,
    certifiedMissions: [],
  };
}
