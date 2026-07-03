/**
 * G5-06 — Recovery & Rollback Engine contracts.
 */

export const FAILURE_CATEGORIES = [
  "workflow_failure",
  "execution_failure",
  "registry_failure",
  "dependency_failure",
  "approval_failure",
  "business_engine_failure",
  "infrastructure_failure",
  "timeout",
  "unexpected_exception",
  "plugin_failure",
] as const;

export type FailureCategory = (typeof FAILURE_CATEGORIES)[number];

export const RECOVERY_STATES = [
  "healthy",
  "monitoring",
  "recovering",
  "retrying",
  "rolling_back",
  "recovered",
  "escalated",
  "failed",
  "archived",
] as const;

export type RecoveryState = (typeof RECOVERY_STATES)[number];

export type ExecutionSnapshot = {
  executionId: string;
  workflowId: string;
  workflowVersion: string;
  completedStepIds: string[];
  stepStates: Record<string, string>;
  registryReferences: Record<string, unknown>;
  executionContext: Record<string, unknown>;
  capturedAt: string;
};

export type RecoveryHistoryEntry = {
  entryId: string;
  state: RecoveryState;
  actorId: string;
  reason: string;
  recordedAt: string;
};

export type RollbackContext = {
  rollbackId: string;
  executionId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  rollbackStrategyId: string;
  recoveryStrategyId: string;
  failureCause: string;
  recoveryResult?: string;
  timestamp: string;
  pillowGovernance: true;
};

export type RecoveryRecord = {
  recoveryId: string;
  executionId: string;
  queueId: string;
  workflowId: string;
  triggerId: string;
  correlationId: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  recoveryState: RecoveryState;
  failureCategory: FailureCategory;
  failureCause: string;
  failedStepId?: string;
  errorClass?: string;
  recoveryRegistryId?: string;
  policyRegistryId?: string;
  recoveryStrategyId?: string;
  rollbackStrategyId?: string;
  recoveryResult?: string;
  retryCount: number;
  maxAttempts: number;
  rollbackId?: string;
  history: RecoveryHistoryEntry[];
  lastSnapshot?: ExecutionSnapshot;
  pillowGovernance: true;
  createdAt: string;
  updatedAt: string;
};

export type ResolvedRecoveryPolicy = {
  recoveryRegistryId?: string;
  policyRegistryId?: string;
  maxAttempts: number;
  backoffMs: number;
  notificationRegistryIds: string[];
  strategies: Array<{
    strategyId: string;
    kind: "retry" | "rollback" | "escalate" | "halt";
    condition?: string;
  }>;
  rollbackMap: Record<string, string>;
};

export type RecoveryOutcome = {
  recoveryId: string;
  recoveryState: RecoveryState;
  resumed: boolean;
  rollbackId?: string;
  reason: string;
};

export type CockpitRecoveryStatusSnapshot = {
  workspaceId: string;
  activeRecoveries: number;
  escalatedCount: number;
  failedCount: number;
  records: RecoveryRecord[];
  rollbacks: RollbackContext[];
  failureSummaries: Array<{
    recoveryId: string;
    failureCategory: FailureCategory;
    failureCause: string;
    recoveryState: RecoveryState;
  }>;
  generatedAt: string;
};
