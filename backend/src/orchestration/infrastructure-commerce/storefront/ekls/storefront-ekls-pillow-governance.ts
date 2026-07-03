/**
 * G2-04 — Pillow governance for storefront EKLS outcomes.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  STOREFRONT_EKLS_OUTCOME_KINDS,
  type StorefrontEklsOutcomeKind,
  type StorefrontEklsOutcomeRecord,
} from "../contracts/storefront-integration-types.js";

export type StorefrontEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateStorefrontEklsOutcomeGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): StorefrontEklsGovernanceResult {
  if (!input.pillowGovernance) {
    return {
      allowed: false,
      reason: "Pillow governance required — direct EKLS writes forbidden",
      eklsGoverned: false,
    };
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

  return {
    allowed: true,
    reason: "Storefront EKLS outcome governance validated",
    eklsGoverned: true,
  };
}

export function validateStorefrontOutcomeRecord(
  record: StorefrontEklsOutcomeRecord,
): StorefrontEklsGovernanceResult {
  if (!record.outcomeId?.trim()) {
    return { allowed: false, reason: "outcomeId is required", eklsGoverned: false };
  }
  if (!record.storefrontId?.trim()) {
    return { allowed: false, reason: "storefrontId is required", eklsGoverned: false };
  }
  if (!record.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!(STOREFRONT_EKLS_OUTCOME_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown outcome kind: ${record.kind}`, eklsGoverned: false };
  }
  if (!Number.isFinite(record.signalValue)) {
    return { allowed: false, reason: "signalValue must be a finite number", eklsGoverned: false };
  }
  return { allowed: true, reason: "Storefront outcome record quality validated", eklsGoverned: false };
}

export function listStorefrontEklsOutcomeKinds(): readonly StorefrontEklsOutcomeKind[] {
  return STOREFRONT_EKLS_OUTCOME_KINDS;
}
