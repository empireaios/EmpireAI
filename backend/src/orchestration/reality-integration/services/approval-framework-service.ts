import type { ApprovalAssessment, ApprovalPolicy, IrreversibleAction } from "../models/approval-framework.js";
import { APPROVAL_POLICIES } from "../models/approval-framework.js";
import { getRealityProvider } from "../models/provider-catalog.js";
import { assessConnectorGovernance } from "./connector-governance-service.js";

/** REAL-003 — Human Approval Framework. */
export function getApprovalPolicy(action: IrreversibleAction): ApprovalPolicy | undefined {
  return APPROVAL_POLICIES.find((p) => p.action === action);
}

export function listApprovalPolicies(): ApprovalPolicy[] {
  return [...APPROVAL_POLICIES];
}

export function assessApprovalRequired(input: {
  workspaceId: string;
  action: IrreversibleAction;
  providerId?: string;
  actor?: string;
}): ApprovalAssessment {
  const policy = getApprovalPolicy(input.action);
  if (!policy) {
    return {
      action: input.action,
      providerId: input.providerId,
      approved: false,
      requiresHumanApproval: true,
      requiresGovernanceCheck: true,
      riskLevel: "CRITICAL",
      reason: "Unknown irreversible action — blocked by default",
      policyId: "unknown-action-block",
    };
  }

  if (input.providerId) {
    const provider = getRealityProvider(input.providerId);
    if (provider && !policy.applicableProviderCategories.includes(provider.category)) {
      return {
        action: input.action,
        providerId: input.providerId,
        approved: false,
        requiresHumanApproval: true,
        requiresGovernanceCheck: true,
        riskLevel: policy.riskLevel,
        reason: `Action ${input.action} not applicable to provider category ${provider.category}`,
        policyId: `category-mismatch-${input.action}`,
      };
    }
  }

  if (policy.requiresGovernanceCheck) {
    const governance = assessConnectorGovernance({
      workspaceId: input.workspaceId,
      providerId: input.providerId ?? "system",
      action: "connect",
      actor: input.actor ?? "system",
    });
    if (!governance.approved) {
      return {
        action: input.action,
        providerId: input.providerId,
        approved: false,
        requiresHumanApproval: policy.requiresFounderApproval,
        requiresGovernanceCheck: true,
        riskLevel: policy.riskLevel,
        reason: `Governance blocked: ${governance.reason}`,
        policyId: governance.policyId ?? `gov-block-${input.action}`,
      };
    }
  }

  return {
    action: input.action,
    providerId: input.providerId,
    approved: false,
    requiresHumanApproval: policy.requiresFounderApproval,
    requiresGovernanceCheck: policy.requiresGovernanceCheck,
    riskLevel: policy.riskLevel,
    reason: policy.requiresFounderApproval
      ? `Founder approval required: ${policy.rationale}`
      : `Governance check passed; execution still blocked until founder approves irreversible action`,
    policyId: `approval-${input.action}`,
  };
}

export function buildApprovalQueueSummary(): Array<{
  action: IrreversibleAction;
  displayName: string;
  riskLevel: string;
  pendingCount: number;
}> {
  return APPROVAL_POLICIES.map((policy) => ({
    action: policy.action,
    displayName: policy.displayName,
    riskLevel: policy.riskLevel,
    pendingCount: policy.requiresFounderApproval ? 1 : 0,
  }));
}
