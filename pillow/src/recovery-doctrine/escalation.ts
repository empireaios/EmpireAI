import { RECOVERY_LIMITS } from "./paths.js";
import type { EscalationLevel, FailureClassification } from "./types.js";

export function selectEscalationLevel(input: {
  classification: FailureClassification;
  recoveryConfidence: number;
  constitutionalConflict?: boolean;
  productionRiskHigh?: boolean;
  requiresIrreversibleAction?: boolean;
  grandKingOverride?: boolean;
}): { level: EscalationLevel; escalated: boolean; reason: string } {
  if (input.grandKingOverride) {
    return { level: "supervisor", escalated: false, reason: "Grand King override — proceed" };
  }

  if (input.requiresIrreversibleAction && RECOVERY_LIMITS.rollbackRequiresGrandKing) {
    return {
      level: "grand_king",
      escalated: true,
      reason: "Irreversible recovery requires Grand King approval",
    };
  }

  if (input.classification === "human_approval_required") {
    return {
      level: "grand_king",
      escalated: true,
      reason: "Failure classification requires human approval",
    };
  }

  if (input.constitutionalConflict) {
    return {
      level: "chief_architect",
      escalated: true,
      reason: "Constitutional conflict detected",
    };
  }

  if (input.productionRiskHigh || input.classification === "production") {
    return {
      level: input.recoveryConfidence < RECOVERY_LIMITS.humanInterventionThreshold
        ? "grand_king"
        : "pillow",
      escalated: input.recoveryConfidence < RECOVERY_LIMITS.recoveryConfidenceThreshold,
      reason: "Production risk exceeds autonomous policy",
    };
  }

  if (input.recoveryConfidence < RECOVERY_LIMITS.humanInterventionThreshold) {
    return {
      level: "chief_architect",
      escalated: true,
      reason: "Recovery confidence below human intervention threshold",
    };
  }

  if (input.recoveryConfidence < RECOVERY_LIMITS.recoveryConfidenceThreshold) {
    return {
      level: "pillow",
      escalated: true,
      reason: "Recovery confidence below autonomous threshold",
    };
  }

  return { level: "supervisor", escalated: false, reason: "Safe for autonomous recovery" };
}
