/**
 * G2-03 — Pillow governance for supplier EKLS observations.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  SUPPLIER_EKLS_OBSERVATION_KINDS,
  type SupplierEklsObservationKind,
  type SupplierEklsObservationRecord,
} from "../contracts/supplier-integration-types.js";

export type SupplierEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateSupplierEklsObservationGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): SupplierEklsGovernanceResult {
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
    reason: "Supplier EKLS observation governance validated",
    eklsGoverned: true,
  };
}

export function validateSupplierObservationRecord(
  record: SupplierEklsObservationRecord,
): SupplierEklsGovernanceResult {
  if (!record.observationId?.trim()) {
    return { allowed: false, reason: "observationId is required", eklsGoverned: false };
  }
  if (!record.supplierId?.trim()) {
    return { allowed: false, reason: "supplierId is required", eklsGoverned: false };
  }
  if (!record.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!(SUPPLIER_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}`, eklsGoverned: false };
  }
  if (!Number.isFinite(record.signalValue)) {
    return { allowed: false, reason: "signalValue must be a finite number", eklsGoverned: false };
  }
  return { allowed: true, reason: "Supplier observation record quality validated", eklsGoverned: false };
}

export function listSupplierEklsObservationKinds(): readonly SupplierEklsObservationKind[] {
  return SUPPLIER_EKLS_OBSERVATION_KINDS;
}
