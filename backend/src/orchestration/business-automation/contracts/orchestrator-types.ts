/**
 * G5-04 — Workflow Orchestrator & Execution Broker contracts.
 */

import type { TriggerRegistryReferences } from "./trigger-types.js";
import type { AutomationExecutorType } from "../../../registry/types/automation-registry-types.js";

export const WORKFLOW_LIFECYCLE_STATES = [
  "workflow_loaded",
  "workflow_validated",
  "workflow_ready",
  "execution_started",
  "step_executing",
  "step_completed",
  "step_failed",
  "step_waiting",
  "workflow_completed",
  "workflow_failed",
  "workflow_cancelled",
  "workflow_recovered",
] as const;

export type WorkflowLifecycleState = (typeof WORKFLOW_LIFECYCLE_STATES)[number];

export const STEP_EXECUTION_STATES = [
  "pending",
  "executing",
  "completed",
  "failed",
  "waiting",
  "skipped",
] as const;

export type StepExecutionState = (typeof STEP_EXECUTION_STATES)[number];

export type ExecutionContext = {
  executionId: string;
  workflowId: string;
  workflowVersion: string;
  triggerId: string;
  queueId: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  environment: string;
  decisionReference?: string;
  approvalReference?: string;
  correlationId: string;
  executionState: WorkflowLifecycleState;
  registryReferences: TriggerRegistryReferences;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
  pillowGovernance: true;
};

export type ResolvedWorkflowStep = {
  stepId: string;
  executorType: AutomationExecutorType;
  executorRef: string;
  dependsOn: string[];
  irreversible?: boolean;
  idempotent?: boolean;
  rollbackStepId?: string;
  condition?: string;
  executorRegistryId?: string;
};

export type ResolvedWorkflowDefinition = {
  workflowId: string;
  workflowVersion: string;
  name: string;
  description: string;
  purpose: string;
  steps: ResolvedWorkflowStep[];
  executionOrder: string[];
  policyRegistryId?: string;
  approvalRegistryId?: string;
  recoveryRegistryId?: string;
  notificationRegistryIds: string[];
  reportRegistryIds: string[];
};

export type StepExecutionRecord = {
  stepId: string;
  state: StepExecutionState;
  executorType: AutomationExecutorType;
  executorRef: string;
  brainDispatchId?: string;
  startedAt?: string;
  completedAt?: string;
  errorClass?: string;
  errorMessage?: string;
  result?: unknown;
};

export type StepResult = {
  stepId: string;
  success: boolean;
  brainDispatchId: string;
  status: "completed" | "failed" | "waiting";
  result?: unknown;
  errorClass?: string;
  errorMessage?: string;
};

export type AutomationRun = {
  executionId: string;
  queueId: string;
  lifecycleState: WorkflowLifecycleState;
  executionContext: ExecutionContext;
  workflow: ResolvedWorkflowDefinition;
  steps: StepExecutionRecord[];
  completedStepIds: string[];
  activeStepId?: string;
  failedStepId?: string;
  createdAt: string;
  updatedAt: string;
  pillowGovernance: true;
};

export type RunSnapshot = {
  workspaceId?: string;
  totalRuns: number;
  runs: AutomationRun[];
  generatedAt: string;
};

export type OrchestratorPickupOptions = {
  actorId: string;
  pillowGovernance: true;
  queueId?: string;
  killSwitchActive?: boolean;
};

export type OrchestratorAdvanceOptions = {
  actorId: string;
  pillowGovernance: true;
  killSwitchActive?: boolean;
};
