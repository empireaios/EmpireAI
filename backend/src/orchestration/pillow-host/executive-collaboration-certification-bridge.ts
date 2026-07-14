import { buildExecutiveCollaborationCertificationConfiguration } from "@empireai/pillow";
import type {
  ExecutiveCollaborationCertificationState,
  ExecutiveCollaborationCertificationReport,
} from "@empireai/pillow";

function buildOfflineCertificationState(): ExecutiveCollaborationCertificationState {
  const configuration = buildExecutiveCollaborationCertificationConfiguration();
  return {
    engineVersion: "PILLOW-EXC-001",
    missionId: "T4-10",
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

/** Fallback Executive Collaboration Certification snapshot when Pillow session is unavailable. */
export function collectExecutiveCollaborationCertificationSnapshot() {
  const engine = buildOfflineCertificationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-10",
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
    latestReport: null as ExecutiveCollaborationCertificationReport | null,
  };
}
