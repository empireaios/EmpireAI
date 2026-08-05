import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalPolicy, ApprovalType, ApvrtInput } from "./types.js";

export class RequirementEngine {
  determineApprovalRequirements(
    store: ApprovalStore,
    input: ApvrtInput,
  ): { stages: string[]; policy: ApprovalPolicy | null; approvalType: ApprovalType } {
    const policy =
      (input.policyId ? store.getPolicy(input.policyId) : null) ??
      this.resolveBySignals(store, input);

    if (policy) {
      return {
        stages: [...policy.stages],
        policy,
        approvalType: policy.approvalType,
      };
    }

    const highRisk = input.highRisk === true;
    const approvalType: ApprovalType =
      input.approvalType ?? (highRisk ? "grand_king" : "pillow");

    if (approvalType === "grand_king" || highRisk) {
      return { stages: ["pillow", "grand_king"], policy: null, approvalType: "grand_king" };
    }
    if (approvalType === "multi_stage") {
      return {
        stages: ["pillow", "factory_lead", "grand_king"],
        policy: null,
        approvalType: "multi_stage",
      };
    }
    if (approvalType === "conditional") {
      return { stages: ["pillow"], policy: null, approvalType: "conditional" };
    }
    if (approvalType === "delegated") {
      return { stages: ["pillow"], policy: null, approvalType: "delegated" };
    }
    return { stages: ["pillow"], policy: null, approvalType: "pillow" };
  }

  private resolveBySignals(store: ApprovalStore, input: ApvrtInput): ApprovalPolicy | null {
    const policies = store.listPolicies();
    if (input.highRisk === true || input.approvalType === "grand_king") {
      return (
        policies.find((p) => p.policyId === "pol-grand-king-restricted") ??
        policies.find((p) => p.requiresGrandKing && p.highRisk) ??
        null
      );
    }
    if (input.approvalType === "multi_stage") {
      return policies.find((p) => p.policyId === "pol-multi-stage-ops") ?? null;
    }
    if (input.approvalType === "conditional" || input.allowEscalation === true) {
      return policies.find((p) => p.policyId === "pol-conditional-escalation") ?? null;
    }
    if (input.approvalType === "delegated" || input.allowDelegation === true) {
      return policies.find((p) => p.policyId === "pol-delegated-ops") ?? null;
    }
    if (input.factory || input.worker || input.missionId) {
      return policies.find((p) => p.policyId === "pol-pillow-standard") ?? null;
    }
    return null;
  }
}
