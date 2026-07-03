/**
 * G7-02 — Commerce readiness validator (G6 + G7-00 + G7-01).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { createGrandKingLiveOperationsModuleContract } from "../../grand-king-live-operations/contract/live-operations-module.js";
import { isLiveOperationsProgrammeEstablished } from "../../grand-king-live-operations/services/live-operations-programme-status.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";
import { createGrandKingProductionWorkspaceModuleContract } from "../../grand-king-production-workspace/contract/production-workspace-module.js";
import { evaluateWorkspaceReadiness } from "../../grand-king-production-workspace/services/workspace-readiness-integration.js";
import {
  resolveIdentityProviders,
  resolveReadinessPolicies,
} from "../../grand-king-production-workspace/registry/production-workspace-registry-resolver.js";

export type CommerceReadinessResult = {
  ready: boolean;
  productionEligible: boolean;
  readinessReference: string;
  authorizationReference: string;
  conditions: string[];
};

export function validateCommerceReadiness(context: RegistryLoaderContext = {}): CommerceReadinessResult {
  const gate = validateProductionEligibilityGate(context);
  const workspaceReadiness = evaluateWorkspaceReadiness(context);
  const liveOps = createGrandKingLiveOperationsModuleContract();
  const workspace = createGrandKingProductionWorkspaceModuleContract();
  const policies = resolveReadinessPolicies(context);
  const identity = resolveIdentityProviders(context);

  const conditions: string[] = [];
  if (!gate.eligible) conditions.push(gate.reason);
  if (!workspaceReadiness.ready) conditions.push("G7-01 production workspace not ready");
  if (!isLiveOperationsProgrammeEstablished(liveOps)) conditions.push("G7 live operations programme required");
  if (workspace.missionId !== "G7-01") conditions.push("G7-01 production workspace required");
  if (identity.length < 1) conditions.push("REG-IDENTITY-PROVIDER authorization required");
  if (process.env.COMMERCE_READINESS_BLOCKED === "true") {
    conditions.push("Commerce readiness blocked by governance signal");
  }

  const ready =
    gate.eligible &&
    workspaceReadiness.ready &&
    isLiveOperationsProgrammeEstablished(liveOps) &&
    workspace.programmeStatus === "production-workspace-established" &&
    policies.length >= 1 &&
    identity.length >= 1 &&
    process.env.COMMERCE_READINESS_BLOCKED !== "true";

  return {
    ready,
    productionEligible: gate.eligible,
    readinessReference: policies[0]?.policyId ?? "readiness-policy-grand-king-production",
    authorizationReference: identity[0]?.providerId ?? "grand-king-identity",
    conditions,
  };
}
