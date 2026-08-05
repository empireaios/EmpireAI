import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalPolicy, ApprovalRequest, ApvrtInput } from "./types.js";

/**
 * Delegate when policy.allowDelegation and constitutionally permitted.
 * Default: grand_king cannot be delegated (final stage or current stage).
 */
export class DelegationEngine {
  canDelegate(request: ApprovalRequest, policy: ApprovalPolicy): { ok: boolean; reason?: string } {
    if (!policy.allowDelegation) {
      return { ok: false, reason: "Policy does not allow delegation" };
    }
    const currentStage = policy.stages[request.stageIndex] ?? request.currentApprover;
    if (currentStage === "grand_king" || request.currentApprover === "grand_king") {
      return { ok: false, reason: "grand_king stage cannot be delegated" };
    }
    if (policy.requiresGrandKing && currentStage === "grand_king") {
      return { ok: false, reason: "Grand King final stage is not delegable" };
    }
    return { ok: true };
  }

  delegate(
    store: ApprovalStore,
    request: ApprovalRequest,
    policy: ApprovalPolicy,
    input: ApvrtInput,
  ): { request: ApprovalRequest | null; error?: string } {
    const check = this.canDelegate(request, policy);
    if (!check.ok) {
      return { request: null, error: check.reason };
    }
    const delegateTo = input.delegateTo ?? input.approver;
    if (!delegateTo) {
      return { request: null, error: "delegateTo required for delegation" };
    }

    const updated = store.updateRequest(request.approvalId, {
      currentApprover: delegateTo,
      currentStatus: "delegated",
      timestampHistory: [...request.timestampHistory, new Date().toISOString()],
    });
    return { request: updated };
  }
}
