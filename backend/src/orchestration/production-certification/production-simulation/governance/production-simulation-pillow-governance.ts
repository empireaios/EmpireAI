/**
 * G6-09 — Production simulation Pillow governance.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";

export type ProductionSimulationPillowContext = {
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "overview" | "run_scenario" | "run_full" | "status" | "override_request";
  pillowGovernance: true;
};

export type ProductionSimulationPillowResult = {
  allowed: boolean;
  reason: string;
  simulationAuthority: boolean;
  safeExecutionBoundary: boolean;
  sandboxEligibility: boolean;
  evidenceIntegrity: boolean;
  overrideEligibility: boolean;
  productionReadinessImpact: boolean;
  eklsGoverned: boolean;
};

function deny(reason: string): ProductionSimulationPillowResult {
  return {
    allowed: false,
    reason,
    simulationAuthority: false,
    safeExecutionBoundary: false,
    sandboxEligibility: false,
    evidenceIntegrity: false,
    overrideEligibility: false,
    productionReadinessImpact: false,
    eklsGoverned: false,
  };
}

export function validateProductionSimulationPillowGovernance(
  context: ProductionSimulationPillowContext,
): ProductionSimulationPillowResult {
  if (!context.pillowGovernance) {
    return deny("Pillow governance required — no simulation bypass");
  }
  if (!context.actorId?.trim() || !context.workspaceId?.trim()) {
    return deny("actorId and workspaceId are required");
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: context.actorId,
      workspaceId: context.workspaceId,
      companyId: context.companyId,
      consumerChannel: "production-certification",
      operation: "store",
    },
    context.workspaceId,
  );

  if (!ekls.allowed) {
    return {
      allowed: false,
      reason: ekls.reason,
      simulationAuthority: true,
      safeExecutionBoundary: true,
      sandboxEligibility: process.env.SIM_BLOCKED_SANDBOX !== "true",
      evidenceIntegrity: false,
      overrideEligibility: context.operation === "override_request",
      productionReadinessImpact: true,
      eklsGoverned: false,
    };
  }

  return {
    allowed: true,
    reason: "Production simulation Pillow governance passed",
    simulationAuthority: true,
    safeExecutionBoundary: process.env.SIM_UNSAFE_LIVE_EXECUTION !== "true",
    sandboxEligibility: process.env.SIM_BLOCKED_SANDBOX !== "true",
    evidenceIntegrity: true,
    overrideEligibility: context.operation === "override_request",
    productionReadinessImpact: context.operation !== "override_request",
    eklsGoverned: true,
  };
}
