/**
 * G5-05 — Pillow Approval Router contracts.
 */

import type { AutomationApprovalTier } from "../../../registry/types/automation-registry-types.js";

export const APPROVAL_STATES = [
  "not_required",
  "pending",
  "awaiting_review",
  "approved",
  "rejected",
  "expired",
  "cancelled",
  "superseded",
  "completed",
] as const;

export type ApprovalState = (typeof APPROVAL_STATES)[number];

export type ApprovalHistoryEntry = {
  entryId: string;
  state: ApprovalState;
  actorId: string;
  reason: string;
  recordedAt: string;
};

export type AutomationApprovalRequest = {
  approvalId: string;
  workflowId: string;
  workflowVersion?: string;
  executionId?: string;
  triggerId: string;
  queueId?: string;
  decisionReference?: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  approvalTier: AutomationApprovalTier;
  approvalPolicyId: string;
  approvalRegistryId: string;
  requestedBy: string;
  requestedAt: string;
  expiryAt?: string;
  correlationId: string;
  approvalState: ApprovalState;
  supportingEvidence?: Record<string, unknown>;
  notificationRegistryIds: string[];
  routingRuleId?: string;
  pillowGovernance: true;
  history: ApprovalHistoryEntry[];
};

export type ResolvedApprovalPolicy = {
  approvalRegistryId: string;
  policyRegistryId?: string;
  tier: AutomationApprovalTier;
  required: boolean;
  expiryMs?: number;
  notificationRegistryIds: string[];
  pillowBridge: boolean;
  routingRuleId?: string;
  reason: string;
};

export type ApprovalSubmissionInput = {
  actorId: string;
  pillowGovernance: true;
  workflowId: string;
  workflowVersion?: string;
  executionId?: string;
  triggerId: string;
  queueId?: string;
  decisionReference?: string;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  correlationId: string;
  approvalRegistryId?: string;
  policyRegistryId?: string;
  payload?: Record<string, unknown>;
  supportingEvidence?: Record<string, unknown>;
};

export type ApprovalOutcomeInput = {
  approvalId: string;
  actorId: string;
  pillowGovernance: true;
  workspaceId: string;
  reason?: string;
};

export type CockpitApprovalCard = {
  approvalId: string;
  workflowId: string;
  triggerId: string;
  approvalTier: AutomationApprovalTier;
  approvalState: ApprovalState;
  requestedBy: string;
  requestedAt: string;
  expiryAt?: string;
  correlationId: string;
  decisionReference?: string;
  summary: string;
};

export type CockpitApprovalStatusSnapshot = {
  workspaceId: string;
  pendingCount: number;
  awaitingReviewCount: number;
  requests: AutomationApprovalRequest[];
  cards: CockpitApprovalCard[];
  generatedAt: string;
};

export type ApprovalSnapshot = {
  workspaceId?: string;
  totalCount: number;
  byState: Record<ApprovalState, number>;
  requests: AutomationApprovalRequest[];
  generatedAt: string;
};
