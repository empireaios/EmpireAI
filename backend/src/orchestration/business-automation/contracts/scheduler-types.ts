/**
 * G5-03 — Workflow Scheduler & Automation Queue contracts.
 */

import type { TriggerRegistryReferences } from "./trigger-types.js";

export const QUEUE_EXECUTION_STATES = [
  "pending",
  "scheduled",
  "queued",
  "waiting",
  "running",
  "paused",
  "retrying",
  "completed",
  "failed",
  "cancelled",
  "recovered",
  "archived",
] as const;

export type QueueExecutionState = (typeof QUEUE_EXECUTION_STATES)[number];

export const SCHEDULE_MODES = [
  "immediate",
  "scheduled",
  "recurring",
  "deferred",
  "retry",
  "recovery",
  "manual",
  "plugin",
] as const;

export type ScheduleMode = (typeof SCHEDULE_MODES)[number];

export type QueuedAutomationRequest = {
  queueId: string;
  workflowId: string;
  workflowVersion: string;
  triggerId: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  priority: "low" | "normal" | "high" | "critical";
  executionState: QueueExecutionState;
  correlationId: string;
  decisionReference?: string;
  approvalReference?: string;
  registryReferences: TriggerRegistryReferences;
  createdAt: string;
  scheduledTime: string;
  executionDeadline?: string;
  retryCount: number;
  scheduleMode: ScheduleMode;
  scheduleRegistryId?: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
  sourceRequestId: string;
  pillowGovernance: true;
  /** Ready for G5-04 orchestrator pickup — no execution in G5-03. */
  orchestratorHandoffReady: boolean;
};

export type SchedulerIntakeOptions = {
  actorId: string;
  pillowGovernance: true;
  scheduleMode?: ScheduleMode;
  scheduleRegistryId?: string;
  deferUntil?: string;
  killSwitchActive?: boolean;
};

export type ResolvedSchedulePolicy = {
  scheduleRegistryId?: string;
  policyRegistryId?: string;
  recoveryRegistryId?: string;
  scheduleMode: ScheduleMode;
  intervalMs?: number;
  maxAttempts: number;
  backoffMs: number;
  executionDeadlineMs?: number;
  timezone?: string;
  expression?: string;
};

export type SchedulerGovernanceContext = {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
};

export type QueueSnapshot = {
  workspaceId?: string;
  totalCount: number;
  byState: Record<QueueExecutionState, number>;
  entries: QueuedAutomationRequest[];
  generatedAt: string;
};
