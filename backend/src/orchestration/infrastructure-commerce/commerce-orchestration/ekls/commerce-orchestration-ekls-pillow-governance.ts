/**
 * G2-08 — Pillow governance for commerce orchestration EKLS observations.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS,
  type CommerceOrchestrationEklsObservationKind,
  type CommerceOrchestrationEklsObservationRecord,
} from "../contracts/commerce-orchestration-types.js";

export type CommerceOrchestrationEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateCommerceOrchestrationEklsGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): CommerceOrchestrationEklsGovernanceResult {
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

  return { allowed: true, reason: "Commerce orchestration EKLS governance validated", eklsGoverned: true };
}

export function validateCommerceOrchestrationObservationRecord(
  record: CommerceOrchestrationEklsObservationRecord,
): CommerceOrchestrationEklsGovernanceResult {
  if (!record.observationId?.trim()) {
    return { allowed: false, reason: "observationId is required", eklsGoverned: false };
  }
  if (!(COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}`, eklsGoverned: false };
  }
  return { allowed: true, reason: "Observation record quality validated", eklsGoverned: false };
}

export function listCommerceOrchestrationEklsObservationKinds(): readonly CommerceOrchestrationEklsObservationKind[] {
  return COMMERCE_ORCHESTRATION_EKLS_OBSERVATION_KINDS;
}
