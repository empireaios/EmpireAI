import { buildContinuousCollaborationConfiguration } from "@empireai/pillow";
import type {
  ContinuousCollaborationRunReport,
  ContinuousCollaborationState,
} from "@empireai/pillow";

function buildOfflineContinuousCollaborationState(): ContinuousCollaborationState {
  const configuration = buildContinuousCollaborationConfiguration();
  return {
    engineVersion: "PILLOW-CC-001",
    missionId: "T4-09",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    activeSession: null,
    health: {
      status: "standby",
      healthScore: 50,
      collaborationEnabled: configuration.enabled,
      sessionsSynchronized: 0,
      lastSynchronizationAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalSynchronizations: 0,
      successfulSynchronizations: 0,
      failedSynchronizations: 0,
      sessionsRestored: 0,
      discussionsUpdated: 0,
      proposalsTracked: 0,
      approvalsTracked: 0,
      preferencesApplied: 0,
      averageSynchronizationDurationMs: 0,
      peakSynchronizationDurationMs: 0,
    },
  };
}

/** Fallback Continuous Collaboration snapshot when Pillow session is unavailable. */
export function collectContinuousCollaborationSnapshot() {
  const engine = buildOfflineContinuousCollaborationState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-09",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalSynchronizations: 0,
      activeDiscussions: 0,
      pendingProposals: 0,
      pendingApprovals: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ContinuousCollaborationRunReport | null,
    activeSession: null,
  };
}
