/**
 * G2-09 — Pillow governance for commerce plugin EKLS observations.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS,
  type CommercePluginEklsObservationKind,
  type CommercePluginEklsObservationRecord,
} from "../contracts/commerce-plugin-integration-types.js";

export type CommercePluginEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateCommercePluginEklsGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): CommercePluginEklsGovernanceResult {
  if (!input.pillowGovernance) {
    return { allowed: false, reason: "Pillow governance required", eklsGoverned: false };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      companyId: input.companyId,
      consumerChannel: "infrastructure-commerce",
      operation: input.operation,
    },
    input.workspaceId,
  );

  if (!ekls.allowed) {
    return { allowed: false, reason: ekls.reason, eklsGoverned: false };
  }

  return { allowed: true, reason: "Commerce plugin EKLS governance validated", eklsGoverned: true };
}

export function validateCommercePluginObservationRecord(
  record: CommercePluginEklsObservationRecord,
): CommercePluginEklsGovernanceResult {
  if (!record.observationId?.trim()) {
    return { allowed: false, reason: "observationId is required", eklsGoverned: false };
  }
  if (!(COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}`, eklsGoverned: false };
  }
  return { allowed: true, reason: "Observation record quality validated", eklsGoverned: false };
}

export function listCommercePluginEklsObservationKinds(): readonly CommercePluginEklsObservationKind[] {
  return COMMERCE_PLUGIN_EKLS_OBSERVATION_KINDS;
}
