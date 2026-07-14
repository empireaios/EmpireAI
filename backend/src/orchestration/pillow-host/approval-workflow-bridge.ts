import { buildApprovalWorkflowConfiguration } from "@empireai/pillow";
import type { ApprovalRunReport, ApprovalWorkflowState } from "@empireai/pillow";

function buildOfflineApprovalWorkflowState(): ApprovalWorkflowState {
  const configuration = buildApprovalWorkflowConfiguration();
  return {
    engineVersion: "PILLOW-AW-001",
    missionId: "T4-07",
    status: "idle",
    initializedAt: new Date().toISOString(),
    configuration,
    latestReport: null,
    latestPresentation: null,
    health: {
      status: "standby",
      healthScore: 50,
      approvalEnabled: configuration.enabled,
      approvalsCompleted: 0,
      lastApprovalAt: null,
      lastValidationDecision: null,
      consecutiveFailures: 0,
      recoveryAttempts: 0,
      activeSessions: 0,
      notes: ["Pillow session unavailable — offline snapshot"],
    },
    performance: {
      totalApprovals: 0,
      successfulApprovals: 0,
      failedApprovals: 0,
      approvedCount: 0,
      rejectedCount: 0,
      deferredCount: 0,
      changesRequestedCount: 0,
      blockedActions: 0,
      dispatchedActions: 0,
      averageApprovalDurationMs: 0,
      peakApprovalDurationMs: 0,
    },
  };
}

/** Fallback Approval Workflow snapshot when Pillow session is unavailable. */
export function collectApprovalWorkflowSnapshot() {
  const engine = buildOfflineApprovalWorkflowState();
  return {
    computedAt: new Date().toISOString(),
    missionId: "T4-07",
    live: false,
    engine,
    cockpit: {
      engineStatus: engine.status,
      healthStatus: engine.health.status,
      lastDecision: null,
      activeSessions: 0,
      totalApprovals: 0,
      approvedCount: 0,
      blockedActions: 0,
      dispatchedActions: 0,
      confidenceScore: 0,
      recentLogs: [],
    },
    latestReport: null as ApprovalRunReport | null,
    latestPresentation: null,
  };
}
