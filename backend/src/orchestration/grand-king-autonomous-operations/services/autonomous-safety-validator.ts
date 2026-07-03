/**
 * G7-07 — Autonomous safety validator.
 */

import type { AutonomousOperation } from "../contracts/autonomous-operations-types.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";
import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { deriveAutonomySignalFromRef, resolveAutonomousOperationDependencies } from "../registry/autonomous-operations-registry-resolver.js";

export type SafetyValidationResult = {
  safe: boolean;
  reason: string;
  productionEligible: boolean;
  riskAcceptable: boolean;
};

export function validateAutonomousSafety(
  operation: Pick<AutonomousOperation, "riskScore" | "autonomyLevel" | "domainId">,
  context: RegistryLoaderContext = {},
): SafetyValidationResult {
  const deps = resolveAutonomousOperationDependencies(context);
  let productionEligible = false;
  try {
    productionEligible = validateProductionEligibilityGate(context).eligible;
  } catch {
    productionEligible = false;
  }

  if (operation.autonomyLevel === "emergency_stop") {
    return {
      safe: false,
      reason: "Emergency stop active — autonomous execution blocked",
      productionEligible,
      riskAcceptable: false,
    };
  }

  if (!productionEligible) {
    return {
      safe: false,
      reason: "Production eligibility gate not satisfied",
      productionEligible: false,
      riskAcceptable: false,
    };
  }

  const threshold =
    deps.prioritizationRuleRefs.reduce((sum, ref) => sum + deriveAutonomySignalFromRef(ref), 0) * 100;
  const riskAcceptable = operation.riskScore <= Math.max(threshold, 80);

  if (!riskAcceptable) {
    return {
      safe: false,
      reason: "Risk score exceeds registry-derived safety threshold",
      productionEligible,
      riskAcceptable: false,
    };
  }

  return {
    safe: true,
    reason: "Autonomous safety validation passed",
    productionEligible,
    riskAcceptable: true,
  };
}
