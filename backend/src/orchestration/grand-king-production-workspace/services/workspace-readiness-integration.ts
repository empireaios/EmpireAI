/**
 * G7-01 — Workspace readiness integration (G6 + G7-00).
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import { createGrandKingLiveOperationsModuleContract } from "../../grand-king-live-operations/contract/live-operations-module.js";
import { isLiveOperationsProgrammeEstablished } from "../../grand-king-live-operations/services/live-operations-programme-status.js";
import { validateProductionEligibilityGate } from "../../grand-king-live-operations/services/production-eligibility-gate.js";
import type { WorkspaceReadinessSummary } from "../contracts/production-workspace-types.js";
import { resolveReadinessPolicies } from "../registry/production-workspace-registry-resolver.js";

export function evaluateWorkspaceReadiness(context: RegistryLoaderContext = {}): WorkspaceReadinessSummary {
  const policies = resolveReadinessPolicies(context);
  const gate = validateProductionEligibilityGate(context);
  const liveOps = createGrandKingLiveOperationsModuleContract();
  const liveOpsReady = isLiveOperationsProgrammeEstablished(liveOps);

  const conditions: string[] = [];
  if (!gate.eligible) conditions.push(gate.reason);
  if (!liveOpsReady) conditions.push("G7 live operations programme not established");
  if (process.env.WORKSPACE_READINESS_BLOCKED === "true") {
    conditions.push("Workspace readiness blocked by governance signal");
  }

  const ready =
    gate.eligible &&
    liveOpsReady &&
    policies.length >= 1 &&
    process.env.WORKSPACE_READINESS_BLOCKED !== "true";

  return {
    ready,
    productionEligible: gate.eligible,
    readinessReference: policies[0]?.policyId ?? "readiness-policy-grand-king-production",
    certificationReference: gate.certificationReference,
    conditions,
  };
}
