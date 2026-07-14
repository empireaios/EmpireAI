/** PILLOW-AW-001 — Approval Workflow types (T4-07). */

import type {
  APPROVAL_DECISIONS,
  APPROVAL_STATUSES,
  ENGINE_STATUSES,
  VALIDATION_DECISIONS,
} from "./paths.js";
import type { ApprovalWorkflowConfiguration } from "./configuration.js";

export type ApprovalWorkflowEngineVersion = "PILLOW-AW-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];
export type ApprovalDecisionType = (typeof APPROVAL_DECISIONS)[number];
export type ValidationDecision = (typeof VALIDATION_DECISIONS)[number];

export type ApprovalRecord = {
  approvalId: string;
  timestamp: string;
  sessionId: string;
  sourceProposalIds: string[];
  sourceComparisonId: string | null;
  sourceExplanationId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  approvalDecision: ApprovalDecisionType;
  approvalStatus: ApprovalStatus;
  approvalRationale: string | null;
  requestedChanges: string | null;
  approvedActionScope: string | null;
  blockedActionScope: string | null;
  grandKingConfirmationRef: string | null;
  confidenceScore: number;
  metadataVersion: string;
};

export type ApprovalSession = {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  approvals: ApprovalRecord[];
  status: ApprovalStatus;
};

export type ApprovalPresentation = {
  presentationId: string;
  timestamp: string;
  sessionId: string;
  sourceProposalIds: string[];
  sourceComparisonId: string | null;
  sourceExplanationId: string | null;
  targetScreenId: string | null;
  targetRouteOrViewId: string | null;
  proposalSummaries: Array<{ proposalId: string; title: string; category: string }>;
  comparisonSummary: string | null;
  explanationSummary: string | null;
  requiresApproval: boolean;
  metadataVersion: string;
};

export type ApprovalRunValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: ValidationDecision;
  approvalsProcessed: number;
  actionsBlocked: number;
  actionsDispatched: number;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ApprovalRunReport = {
  approvalRunReportId: string;
  runTimestamp: string;
  session: ApprovalSession;
  approval: ApprovalRecord;
  presentation: ApprovalPresentation | null;
  gatekeeperResult: {
    allowed: boolean;
    blocked: boolean;
    reason: string;
  };
  dispatchResult: {
    dispatched: boolean;
    targetSystem: string | null;
    scope: string | null;
  };
  validation: ApprovalRunValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ApprovalHealthReport = {
  status: "healthy" | "degraded" | "failed" | "standby";
  healthScore: number;
  approvalEnabled: boolean;
  approvalsCompleted: number;
  lastApprovalAt: string | null;
  lastValidationDecision: ValidationDecision | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  activeSessions: number;
  notes: string[];
};

export type ApprovalPerformanceStats = {
  totalApprovals: number;
  successfulApprovals: number;
  failedApprovals: number;
  approvedCount: number;
  rejectedCount: number;
  deferredCount: number;
  changesRequestedCount: number;
  blockedActions: number;
  dispatchedActions: number;
  averageApprovalDurationMs: number;
  peakApprovalDurationMs: number;
};

export type ApprovalLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ApprovalWorkflowState = {
  engineVersion: ApprovalWorkflowEngineVersion;
  missionId: "T4-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: ApprovalWorkflowConfiguration;
  latestReport: ApprovalRunReport | null;
  latestPresentation: ApprovalPresentation | null;
  health: ApprovalHealthReport;
  performance: ApprovalPerformanceStats;
};

export type ApprovalWorkflowCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: ApprovalHealthReport["status"];
  lastDecision: ValidationDecision | null;
  activeSessions: number;
  totalApprovals: number;
  approvedCount: number;
  blockedActions: number;
  dispatchedActions: number;
  confidenceScore: number;
  recentLogs: string[];
};

/** Input for submitting a Grand King approval decision. */
export type ApprovalInput = {
  sessionId?: string;
  approvalDecision: ApprovalDecisionType;
  approvalRationale?: string;
  requestedChanges?: string;
  proposalIds?: string[];
  comparisonId?: string | null;
  explanationId?: string | null;
  targetProposalId?: string | null;
  grandKingConfirmationRef?: string | null;
};

/** Input for presenting an approval-ready decision package. */
export type ApprovalPresentationInput = {
  sessionId?: string;
  proposalIds?: string[];
  comparisonId?: string | null;
  explanationId?: string | null;
};
