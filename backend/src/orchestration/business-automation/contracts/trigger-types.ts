/**
 * G5-02 — Automation trigger types and lifecycle contracts.
 */

import type { AutomationApprovalTier } from "../../../registry/types/automation-registry-types.js";

export const TRIGGER_CATEGORIES = [
  "executive_decision",
  "brain_dispatch",
  "pillow_approval",
  "scheduler",
  "registry_event",
  "business_event",
  "mission_event",
  "cockpit_action",
  "manual_executive",
  "future_plugin",
] as const;

export type TriggerCategory = (typeof TRIGGER_CATEGORIES)[number];

export const DECISION_GATE_ELIGIBLE = ["PROCEED", "PROCEED_WITH_CAUTION"] as const;
export const DECISION_GATE_HELD = ["HOLD", "PIVOT"] as const;
export const DECISION_GATE_STOP = ["STOP"] as const;

export type DecisionGateRecommendation =
  | (typeof DECISION_GATE_ELIGIBLE)[number]
  | (typeof DECISION_GATE_HELD)[number]
  | (typeof DECISION_GATE_STOP)[number]
  | string;

export type TriggerApprovalState =
  | "not_required"
  | "pending"
  | "routed_a0"
  | "routed_a1"
  | "routed_a2"
  | "routed_a3"
  | "rejected";

export type TriggerRegistryReferences = {
  triggerId: string;
  triggerVersion: string;
  workflowId: string;
  workflowVersion: string;
  policyId?: string;
  approvalId?: string;
};

export type TriggerContext = {
  triggerId: string;
  source: TriggerCategory;
  workspaceId: string;
  companyId?: string;
  brandId?: string;
  environment: string;
  decisionReference?: string;
  registryReferences: TriggerRegistryReferences;
  timestamp: string;
  priority: "low" | "normal" | "high" | "critical";
  correlationId: string;
  approvalState: TriggerApprovalState;
  decisionSnapshot?: {
    finalRecommendation: string;
    decisionConfidence: number;
    executiveRecommendation: string;
  };
};

export type TriggerIntakeRequest = {
  category: TriggerCategory;
  workspaceId: string;
  actorId: string;
  pillowGovernance: true;
  correlationId: string;
  companyId?: string;
  brandId?: string;
  environment?: string;
  priority?: TriggerContext["priority"];
  /** When true, all automation triggers are blocked (Cockpit kill switch). */
  killSwitchActive?: boolean;
  /** Optional explicit registry trigger row id — resolved dynamically when omitted. */
  registryTriggerId?: string;
  payload?: Record<string, unknown>;
};

export type ApprovalRoutingResult = {
  required: boolean;
  tier?: AutomationApprovalTier;
  approvalState: TriggerApprovalState;
  routingRuleId?: string;
  reason: string;
};

export type AutomationRequest = {
  requestId: string;
  state: "QUEUED_FOR_SCHEDULER";
  triggerContext: TriggerContext;
  workflowRef: { id: string; version: string };
  registryRefs: TriggerRegistryReferences;
  approvalRouting: ApprovalRoutingResult;
  correlationId: string;
  createdAt: string;
  /** G5-03 automation queue entry id — set after canonical scheduler intake. */
  queueId?: string;
  /** G5-03 scheduler consumes this — no workflow execution in G5-02. */
  schedulerHandoff: true;
};

export type TriggerEvaluationOutcome = "accepted" | "rejected" | "held" | "approval_required";

export type TriggerEvaluation = {
  triggerId: string;
  category: TriggerCategory;
  outcome: TriggerEvaluationOutcome;
  reason: string;
  triggerContext?: TriggerContext;
  automationRequest?: AutomationRequest;
  decisionReference?: string;
  approvalRouting?: ApprovalRoutingResult;
  /** G5-05 canonical approval request id when outcome is approval_required. */
  approvalId?: string;
};

export type AutomationTriggerGovernanceContext = {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  killSwitchActive?: boolean;
};

export type CockpitTriggerStatusEntry = {
  triggerId: string;
  category: TriggerCategory;
  outcome: TriggerEvaluationOutcome;
  approvalState: TriggerApprovalState;
  correlationId: string;
  timestamp: string;
  reason: string;
};

export type CockpitTriggerStatusSnapshot = {
  workspaceId: string;
  entries: CockpitTriggerStatusEntry[];
  queuedRequestCount: number;
  generatedAt: string;
};
