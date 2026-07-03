/**
 * G7-04 — Grand King executive decision contract types.
 */

import { z } from "zod";
import type {
  ExecutiveDecisionStatus,
  ExecutiveDecisionType,
  ExecutiveDomainId,
  ExecutivePriority,
} from "../../../registry/types/executive-decision-registry-types.js";
import {
  EXECUTIVE_DECISION_STATUSES,
  EXECUTIVE_DECISION_TYPES,
  EXECUTIVE_DOMAIN_IDS,
  EXECUTIVE_DECISION_REGISTRY_VERSION,
  EXECUTIVE_PRIORITIES,
} from "../../../registry/types/executive-decision-registry-types.js";

export const GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION = "g7-04-v1" as const;

export {
  EXECUTIVE_DECISION_TYPES,
  EXECUTIVE_DECISION_STATUSES,
  EXECUTIVE_DOMAIN_IDS,
  EXECUTIVE_PRIORITIES,
  EXECUTIVE_DECISION_REGISTRY_VERSION,
};
export type { ExecutiveDecisionType, ExecutiveDecisionStatus, ExecutiveDomainId, ExecutivePriority };

export const EXECUTIVE_DECISION_EKLS_KINDS = [
  "executive_decision_created",
  "executive_decision_completed",
  "executive_decision_rejected",
  "executive_recommendation_generated",
  "executive_risk_detected",
  "executive_learning_recorded",
] as const;

export type ExecutiveDecisionEklsKind = (typeof EXECUTIVE_DECISION_EKLS_KINDS)[number];

export type ExecutiveDecisionEvidence = {
  evidenceId: string;
  kind: "reference" | "signal" | "redacted" | "outcome";
  summary: string;
  ref?: string;
};

/** G7-04 — Every executive decision conforms to this contract. */
export type ExecutiveDecision = {
  decisionId: string;
  decisionType: ExecutiveDecisionType;
  workspaceId: string;
  accountHolderId: string;
  sourceModule: string;
  targetModule: string;
  priority: ExecutivePriority;
  status: ExecutiveDecisionStatus;
  recommendedAction: string;
  executedAction?: string;
  approvalReference: string;
  riskReference: string;
  evidence: ExecutiveDecisionEvidence[];
  createdAt: string;
  completedAt?: string;
  correlationId: string;
  governanceState: string;
  domainId?: ExecutiveDomainId;
};

export type ExecutiveRecommendation = {
  recommendationId: string;
  domainId: ExecutiveDomainId;
  decisionType: ExecutiveDecisionType;
  priority: ExecutivePriority;
  summary: string;
  recommendedAction: string;
  ruleReference: string;
  generatedAt: string;
};

export type ExecutiveKpiSnapshot = {
  revenue: number;
  orders: number;
  automationSuccessRate: number;
  workflowQueue: number;
  approvalQueue: number;
  recoveryQueue: number;
  providerHealth: number;
  productionReadiness: number;
  commerceReadiness: number;
  businessHealth: number;
  riskLevel: "low" | "medium" | "high" | "critical";
  incidentCount: number;
  learningGrowth: number;
  empireHealthScore: number;
  computedAt: string;
  policyReference: string;
};

export type ExecutiveOperationsOverview = {
  frameworkVersion: typeof GRAND_KING_EXECUTIVE_DECISION_CENTRE_VERSION;
  domainCount: number;
  pendingDecisions: number;
  activeRecommendations: number;
  empireHealthScore: number;
  workspaceId: string;
  accountHolderId: string;
  generatedAt: string;
};

export type ExecutiveBlockerSummary = {
  blockerCount: number;
  blockers: Array<{ blockerId: string; domain: string; message: string; severity: string }>;
};

export type ExecutiveOpportunitySummary = {
  opportunityCount: number;
  opportunities: Array<{ opportunityId: string; domain: string; summary: string; priority: string }>;
};

export type ExecutiveRiskSummary = {
  riskLevel: ExecutiveKpiSnapshot["riskLevel"];
  riskCount: number;
  risks: Array<{ riskId: string; domain: string; summary: string; severity: string }>;
};

export type ExecutiveApprovalSummary = {
  pendingCount: number;
  approvals: Array<{ approvalId: string; domain: string; status: string }>;
};

export type ExecutiveTimelineEntry = {
  entryId: string;
  timestamp: string;
  kind: string;
  summary: string;
  module: string;
};

export type ExecutiveNotification = {
  notificationId: string;
  priority: ExecutivePriority;
  summary: string;
  domainId: ExecutiveDomainId;
  createdAt: string;
  read: boolean;
};

export const executiveDecisionPluginManifestSchema = z.object({
  pluginId: z.string().min(1),
  pluginName: z.string().min(1),
  pluginKind: z.enum(["decision", "recommendation", "kpi", "notification", "timeline"]),
  pillowGovernance: z.literal(true),
});

export type ExecutiveDecisionPluginManifest = z.infer<typeof executiveDecisionPluginManifestSchema>;

export const VALID_EXECUTIVE_DECISION_TRANSITIONS: Record<
  ExecutiveDecisionStatus,
  ExecutiveDecisionStatus[]
> = {
  pending: ["approved", "rejected", "executing", "escalated", "cancelled"],
  approved: ["executing", "completed", "cancelled"],
  rejected: ["cancelled"],
  executing: ["completed", "cancelled", "escalated"],
  completed: [],
  cancelled: [],
  escalated: ["executing", "completed", "cancelled"],
};

export function isValidExecutiveDecisionTransition(
  from: ExecutiveDecisionStatus,
  to: ExecutiveDecisionStatus,
): boolean {
  return VALID_EXECUTIVE_DECISION_TRANSITIONS[from]?.includes(to) ?? false;
}
