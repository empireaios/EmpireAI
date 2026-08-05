import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalPolicy, ApprovalRequest, ApvrtInput } from "./types.js";

export class EscalationEngine {
  canEscalate(policy: ApprovalPolicy): { ok: boolean; reason?: string } {
    if (!policy.allowEscalation) {
      return { ok: false, reason: "Policy does not allow escalation" };
    }
    return { ok: true };
  }

  escalate(
    store: ApprovalStore,
    request: ApprovalRequest,
    policy: ApprovalPolicy,
    input: ApvrtInput,
  ): { request: ApprovalRequest | null; error?: string } {
    const check = this.canEscalate(policy);
    if (!check.ok) {
      return { request: null, error: check.reason };
    }

    const escalateTo =
      input.escalateTo ??
      (policy.requiresGrandKing || policy.highRisk ? "grand_king" : "pillow");
    const entry = `${request.currentApprover}->${escalateTo}@${new Date().toISOString()}`;

    const updated = store.updateRequest(request.approvalId, {
      currentApprover: escalateTo,
      currentStatus: escalateTo === "grand_king" ? "awaiting_grand_king" : "escalated",
      escalationHistory: [...request.escalationHistory, entry],
      timestampHistory: [...request.timestampHistory, new Date().toISOString()],
    });
    return { request: updated };
  }
}
