/**
 * G2-06 — Pillow governance for logistics EKLS observations.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  LOGISTICS_EKLS_OBSERVATION_KINDS,
  type LogisticsEklsObservationKind,
  type LogisticsEklsObservationRecord,
} from "../contracts/logistics-integration-types.js";

export type LogisticsEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateLogisticsEklsObservationGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): LogisticsEklsGovernanceResult {
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
    reason: "Logistics EKLS observation governance validated",
    eklsGoverned: true,
  };
}

export function validateLogisticsObservationRecord(
  record: LogisticsEklsObservationRecord,
): LogisticsEklsGovernanceResult {
  if (!record.observationId?.trim()) {
    return { allowed: false, reason: "observationId is required", eklsGoverned: false };
  }
  if (!record.providerId?.trim()) {
    return { allowed: false, reason: "providerId is required", eklsGoverned: false };
  }
  if (!record.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!(LOGISTICS_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}`, eklsGoverned: false };
  }
  if (!Number.isFinite(record.signalValue)) {
    return { allowed: false, reason: "signalValue must be a finite number", eklsGoverned: false };
  }
  return {
    allowed: true,
    reason: "Logistics observation record quality validated",
    eklsGoverned: false,
  };
}

export function listLogisticsEklsObservationKinds(): readonly LogisticsEklsObservationKind[] {
  return LOGISTICS_EKLS_OBSERVATION_KINDS;
}
