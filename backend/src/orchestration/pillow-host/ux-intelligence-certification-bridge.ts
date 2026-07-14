import { buildUxIntelligenceCertificationConfiguration } from "@empireai/pillow";
import type {
  UxIntelligenceCertificationState,
  UxIntelligenceCertificationReport,
} from "@empireai/pillow";

function buildOfflineCertificationState(): UxIntelligenceCertificationState {
  const configuration = buildUxIntelligenceCertificationConfiguration();
  return {
    engineVersion: "PILLOW-UIC-001",
    missionId: "T2-10",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    health: {
      status: "standby",
      healthScore: 50,
      certificationEnabled: configuration.enabled,
      lastCertificationAt: null,
      lastCertificationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalCertifications: 0,
      successfulCertifications: 0,
      failedCertifications: 0,
      averageCertificationDurationMs: 0,
      peakCertificationDurationMs: 0,
    },
  };
}

/** Fallback UX Intelligence Certification snapshot when Pillow session is unavailable. */
export function collectUxIntelligenceCertificationSnapshot() {
  const engine = buildOfflineCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T2-10",
    live: false,
    engine,
    cockpit: {
      certificationStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      missionsPassed: 0,
      missionsFailed: 0,
      endToEndPassed: false,
      totalCertifications: 0,
      recentLogs: [],
    },
    latestReport: null as UxIntelligenceCertificationReport | null,
  };
}
