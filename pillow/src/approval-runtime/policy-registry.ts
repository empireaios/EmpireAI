import { APVRT_METADATA_VERSION } from "./paths.js";
import type { ApprovalStore } from "./approval-store.js";
import type { ApprovalPolicy, ApprovalType, ApvrtInput } from "./types.js";

export class PolicyRegistry {
  registerPolicy(store: ApprovalStore, input: ApvrtInput): ApprovalPolicy {
    const policyId = input.policyId!;
    const existing = store.getPolicy(policyId);
    if (existing) {
      return existing;
    }

    const approvalType: ApprovalType = input.approvalType ?? "pillow";
    const stages =
      input.stages && input.stages.length > 0
        ? [...input.stages]
        : approvalType === "grand_king"
          ? ["pillow", "grand_king"]
          : approvalType === "multi_stage"
            ? ["pillow", "factory_lead", "grand_king"]
            : ["pillow"];

    const requiresGrandKing =
      input.requiresGrandKing ??
      stages.includes("grand_king") ??
      approvalType === "grand_king";
    const requiresPillow = input.requiresPillow ?? stages.includes("pillow") ?? true;
    const highRisk = input.highRisk ?? requiresGrandKing;

    const policy: ApprovalPolicy = {
      policyId,
      approvalType,
      policyName: input.policyName ?? policyId,
      stages,
      requiresPillow,
      requiresGrandKing,
      allowDelegation: input.allowDelegation ?? false,
      allowEscalation: input.allowEscalation ?? false,
      timeoutMs: input.timeoutMs ?? 86_400_000,
      highRisk,
      metadataVersion: APVRT_METADATA_VERSION,
      structuralSignalOnly: true,
      fabricated: false,
    };

    return store.savePolicy(policy);
  }

  getPolicy(store: ApprovalStore, policyId: string) {
    return store.getPolicy(policyId);
  }

  listPolicies(store: ApprovalStore) {
    return store.listPolicies();
  }
}
