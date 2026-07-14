import { buildAutonomousUxAuditConfiguration } from "@empireai/pillow";
import type {
  AutonomousUxAuditRunReport,
  AutonomousUxAuditState,
} from "@empireai/pillow";

function buildOfflineAutonomousUxAuditState(): AutonomousUxAuditState {
  const configuration = buildAutonomousUxAuditConfiguration();
  return {
    engineVersion: "PILLOW-AUA-001",
    missionId: "T5-02",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    latestAudit: null,
    health: {
      status: "standby",
      healthScore: 50,
      auditEnabled: configuration.enabled,
      continuousAuditActive: false,
      lastAuditAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalAudits: 0,
      successfulAudits: 0,
      failedAudits: 0,
      totalIssuesDetected: 0,
      layoutIssuesDetected: 0,
      componentIssuesDetected: 0,
      navigationIssuesDetected: 0,
      workflowIssuesDetected: 0,
      accessibilityIssuesDetected: 0,
      consistencyIssuesDetected: 0,
      stateIssuesDetected: 0,
      averageAuditDurationMs: 0,
      peakAuditDurationMs: 0,
      skippedCycles: 0,
    },
  };
}

/** Fallback Autonomous UX Audit snapshot when Pillow session is unavailable. */
export function collectAutonomousUxAuditSnapshot() {
  const engine = buildOfflineAutonomousUxAuditState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T5-02",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      continuousAuditActive: false,
      totalAudits: 0,
      totalIssuesDetected: 0,
      layoutIssuesDetected: 0,
      accessibilityIssuesDetected: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as AutonomousUxAuditRunReport | null,
    activeSession: null,
    latestAudit: null,
  };
}
