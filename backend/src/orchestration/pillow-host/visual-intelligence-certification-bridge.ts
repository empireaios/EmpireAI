import { buildVisualIntelligenceCertificationConfiguration } from "@empireai/pillow";
import type {
  VisualIntelligenceCertificationReport,
  VisualIntelligenceCertificationState,
} from "@empireai/pillow";

function buildOfflineVisualIntelligenceCertificationState(): VisualIntelligenceCertificationState {
  const configuration = buildVisualIntelligenceCertificationConfiguration();
  return {
    engineVersion: "PILLOW-VIC-001",
    missionId: "T5-10",
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

/** Fallback Visual Intelligence Certification snapshot when Pillow session is unavailable. */
export function collectVisualIntelligenceCertificationSnapshot() {
  const engine = buildOfflineVisualIntelligenceCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-10",
    live: false,
    engine,
    cockpit: {
      certificationStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      programmesPassed: 0,
      programmesFailed: 0,
      t5MissionsPassed: 0,
      t5MissionsFailed: 0,
      endToEndPassed: false,
      grandKingAuthorityPreserved: true,
      confidenceScore: 0,
      totalCertifications: 0,
      recentLogs: [],
    },
    latestReport: null as VisualIntelligenceCertificationReport | null,
  };
}
