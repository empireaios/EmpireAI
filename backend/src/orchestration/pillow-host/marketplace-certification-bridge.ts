import { buildMarketplaceCertificationConfiguration } from "@empireai/pillow";
import type {
  MarketplaceCertificationReport,
  MarketplaceCertificationState,
} from "@empireai/pillow";

const CERTIFICATION_SCHEMA_VERSION = "MCT-SCHEMA-001-v1";

function buildOfflineMarketplaceCertificationState(): MarketplaceCertificationState {
  const configuration = buildMarketplaceCertificationConfiguration();
  return {
    engineVersion: "PILLOW-MCT-001",
    missionId: "R1-15",
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

/** Fallback Marketplace Certification snapshot when Pillow session is unavailable. */
export function collectMarketplaceCertificationSnapshot() {
  const engine = buildOfflineMarketplaceCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "R1-15",
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
    latestReport: null as MarketplaceCertificationReport | null,
    certifiedMissions: [],
  };
}
