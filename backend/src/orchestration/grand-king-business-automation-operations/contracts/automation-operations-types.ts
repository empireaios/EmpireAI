/**
 * G7-03 — Grand King business automation operations contract types.
 */

import { z } from "zod";
import type {
  AutomationHealthStatus,
  AutomationOperationDomainId,
  AutomationOperationState,
} from "../../../registry/types/automation-operations-registry-types.js";
import {
  AUTOMATION_HEALTH_STATUSES,
  AUTOMATION_OPERATION_DOMAIN_IDS,
  AUTOMATION_OPERATION_STATES,
  AUTOMATION_OPERATIONS_REGISTRY_VERSION,
} from "../../../registry/types/automation-operations-registry-types.js";

export const GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION = "g7-03-v1" as const;

export {
  AUTOMATION_OPERATION_STATES,
  AUTOMATION_HEALTH_STATUSES,
  AUTOMATION_OPERATION_DOMAIN_IDS,
  AUTOMATION_OPERATIONS_REGISTRY_VERSION,
};
export type { AutomationOperationState, AutomationHealthStatus, AutomationOperationDomainId };

export const AUTOMATION_OPERATIONS_EKLS_KINDS = [
  "automation_operation_started",
  "automation_operation_paused",
  "automation_operation_resumed",
  "automation_operation_completed",
  "automation_operation_failed",
  "automation_operation_recovered",
  "automation_operation_learning",
] as const;

export type AutomationOperationsEklsKind = (typeof AUTOMATION_OPERATIONS_EKLS_KINDS)[number];

export type AutomationOperationEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "redacted" | "outcome";
  summary: string;
  ref?: string;
};

export type AutomationOperationRisk = {
  riskId: string;
  domainId: string;
  severity: "info" | "low" | "medium" | "high" | "critical";
  summary: string;
  mitigation?: string;
};

export type AutomationOperationBlocker = {
  blockerId: string;
  domainId: string;
  severity: AutomationOperationRisk["severity"];
  message: string;
  recommendation?: string;
};

/** G7-03 — Every live automation operation conforms to this contract. */
export type AutomationOperation = {
  automationOperationId: string;
  workflowRunId: string;
  workflowId: string;
  workspaceId: string;
  brandId: string;
  triggerId: string;
  queueId: string;
  approvalId: string;
  recoveryId: string;
  executionStatus: AutomationOperationState;
  healthStatus: AutomationHealthStatus;
  readinessReference: string;
  evidence: AutomationOperationEvidence[];
  risks: AutomationOperationRisk[];
  blockers: AutomationOperationBlocker[];
  startedAt: string;
  completedAt?: string;
  correlationId: string;
  governanceState: string;
  domainId: AutomationOperationDomainId;
  domainName: string;
};

export type AutomationOperationRun = {
  runId: string;
  correlationId: string;
  operations: AutomationOperation[];
  executingCount: number;
  blockedCount: number;
  scannedAt: string;
  discoverySource: "REG-AUTOMATION-WORKFLOW";
};

export type AutomationOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_BUSINESS_AUTOMATION_OPERATIONS_VERSION;
  domainCount: number;
  operationCount: number;
  executingOperations: number;
  productionEligible: boolean;
  workspaceId: string;
  brandId: string;
  generatedAt: string;
};

export type AutomationOperationHealthSummary = {
  score: number;
  healthy: boolean;
  healthStatus: AutomationHealthStatus;
  executionStatus: AutomationOperationState;
  signals: string[];
  blockers: AutomationOperationBlocker[];
};

export type AutomationOperationDependencySummary = {
  readinessPolicy: string;
  workflowRegistry: string;
  policyRegistry: string;
  executorRegistry: string;
  approvalRegistry: string;
  recoveryRegistry: string;
  workflowIds: string[];
  policyIds: string[];
  executorIds: string[];
  approvalIds: string[];
  recoveryIds: string[];
};

export const VALID_AUTOMATION_OPERATION_TRANSITIONS: Record<
  AutomationOperationState,
  AutomationOperationState[]
> = {
  ready: ["waiting", "scheduled", "executing", "blocked"],
  waiting: ["scheduled", "blocked"],
  scheduled: ["executing", "cancelled", "blocked"],
  executing: ["paused", "approval_pending", "recovering", "completed", "failed", "blocked", "cancelled"],
  paused: ["executing", "cancelled", "blocked"],
  approval_pending: ["executing", "cancelled", "failed", "blocked"],
  recovering: ["executing", "failed", "completed", "blocked"],
  completed: [],
  cancelled: [],
  failed: ["recovering", "blocked"],
  blocked: ["ready"],
};

export function isValidAutomationOperationTransition(
  from: AutomationOperationState,
  to: AutomationOperationState,
): boolean {
  return VALID_AUTOMATION_OPERATION_TRANSITIONS[from]?.includes(to) ?? false;
}

export const automationOperationsPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["workflow", "trigger", "approval", "recovery", "monitoring"]),
  pillowGovernance: z.literal(true),
});

export type AutomationOperationsPluginManifest = z.infer<typeof automationOperationsPluginManifestSchema>;

export type WorkflowQueueSummary = {
  queueDepth: number;
  waitingCount: number;
  scheduledCount: number;
  operations: Array<Pick<AutomationOperation, "automationOperationId" | "domainId" | "executionStatus">>;
};

export type ActiveExecutionSummary = {
  executingCount: number;
  operations: Array<Pick<AutomationOperation, "automationOperationId" | "workflowRunId" | "executionStatus">>;
};

export type ApprovalQueueSummary = {
  pendingCount: number;
  operations: Array<Pick<AutomationOperation, "automationOperationId" | "approvalId" | "executionStatus">>;
};

export type RecoverySummary = {
  recoveringCount: number;
  failedCount: number;
  operations: Array<Pick<AutomationOperation, "automationOperationId" | "recoveryId" | "executionStatus">>;
};
