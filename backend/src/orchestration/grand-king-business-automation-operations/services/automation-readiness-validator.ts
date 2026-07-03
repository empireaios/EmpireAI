/**
 * G7-03 — Automation readiness validator.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { createGrandKingBusinessAutomationOperationsModuleContract } from "../contract/automation-operations-module.js";
import { createGrandKingCommerceOperationsModuleContract } from "../../grand-king-commerce-operations/contract/commerce-operations-module.js";
import { createGrandKingProductionWorkspaceModuleContract } from "../../grand-king-production-workspace/contract/production-workspace-module.js";
import { createGrandKingLiveOperationsModuleContract } from "../../grand-king-live-operations/contract/live-operations-module.js";
import { isLiveOperationsProgrammeEstablished } from "../../grand-king-live-operations/services/live-operations-programme-status.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";
import { resolveReadinessPolicies } from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";
import { resolveAutomationOperationDependencies } from "../registry/automation-operations-registry-resolver.js";

export type AutomationReadinessResult = {
  ready: boolean;
  productionEligible: boolean;
  readinessReference: string;
  conditions: string[];
};

export function validateAutomationReadiness(context: RegistryLoaderContext = {}): AutomationReadinessResult {
  const gate = validateProductionEligibilityGate(context);
  const liveOps = createGrandKingLiveOperationsModuleContract();
  const workspace = createGrandKingProductionWorkspaceModuleContract();
  const commerce = createGrandKingCommerceOperationsModuleContract();
  const automation = createGrandKingBusinessAutomationOperationsModuleContract();
  const policies = resolveReadinessPolicies(context);
  const deps = resolveAutomationOperationDependencies(context);

  const conditions: string[] = [];
  if (!gate.eligible) conditions.push(gate.reason);
  if (!isLiveOperationsProgrammeEstablished(liveOps)) {
    conditions.push("G7 live operations programme required");
  }
  if (workspace.programmeStatus !== "production-workspace-established") {
    conditions.push("G7-01 production workspace required");
  }
  if (commerce.programmeStatus !== "commerce-operations-established") {
    conditions.push("G7-02 commerce operations required");
  }
  if (deps.workflowIds.length < 1) conditions.push("REG-AUTOMATION-WORKFLOW rows required");
  if (deps.policyIds.length < 1) conditions.push("REG-AUTOMATION-POLICY rows required");
  if (deps.executorIds.length < 1) conditions.push("REG-AUTOMATION-EXECUTOR rows required");
  if (deps.approvalIds.length < 1) conditions.push("REG-AUTOMATION-APPROVAL rows required");
  if (deps.recoveryIds.length < 1) conditions.push("REG-AUTOMATION-RECOVERY rows required");
  if (process.env.AUTOMATION_READINESS_BLOCKED === "true") {
    conditions.push("Automation readiness blocked by governance signal");
  }

  const ready =
    gate.eligible &&
    isLiveOperationsProgrammeEstablished(liveOps) &&
    workspace.programmeStatus === "production-workspace-established" &&
    commerce.programmeStatus === "commerce-operations-established" &&
    automation.missionId === "G7-03" &&
    policies.length >= 1 &&
    deps.workflowIds.length >= 1 &&
    deps.policyIds.length >= 1 &&
    deps.executorIds.length >= 1 &&
    deps.approvalIds.length >= 1 &&
    deps.recoveryIds.length >= 1 &&
    process.env.AUTOMATION_READINESS_BLOCKED !== "true";

  return {
    ready,
    productionEligible: gate.eligible,
    readinessReference: policies[0]?.policyId ?? "readiness-policy-grand-king-production",
    conditions,
  };
}
