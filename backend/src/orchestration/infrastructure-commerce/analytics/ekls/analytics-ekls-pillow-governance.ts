/**
 * G2-07 — Pillow governance for analytics EKLS observations.
 */

import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  ANALYTICS_EKLS_OBSERVATION_KINDS,
  type AnalyticsEklsObservationKind,
  type AnalyticsEklsObservationRecord,
} from "../contracts/analytics-integration-types.js";

export type AnalyticsEklsGovernanceResult = {
  allowed: boolean;
  reason: string;
  eklsGoverned: boolean;
};

export function validateAnalyticsEklsObservationGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  companyId?: string;
  operation: "store" | "retrieve" | "search";
}): AnalyticsEklsGovernanceResult {
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
    reason: "Analytics EKLS observation governance validated",
    eklsGoverned: true,
  };
}

export function validateAnalyticsObservationRecord(
  record: AnalyticsEklsObservationRecord,
): AnalyticsEklsGovernanceResult {
  if (!record.observationId?.trim()) {
    return { allowed: false, reason: "observationId is required", eklsGoverned: false };
  }
  if (!record.analyticsId?.trim()) {
    return { allowed: false, reason: "analyticsId is required", eklsGoverned: false };
  }
  if (!record.workspaceId?.trim()) {
    return { allowed: false, reason: "workspaceId is required", eklsGoverned: false };
  }
  if (!(ANALYTICS_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}`, eklsGoverned: false };
  }
  if (!Number.isFinite(record.signalValue)) {
    return { allowed: false, reason: "signalValue must be a finite number", eklsGoverned: false };
  }
  return {
    allowed: true,
    reason: "Analytics observation record quality validated",
    eklsGoverned: false,
  };
}

export function listAnalyticsEklsObservationKinds(): readonly AnalyticsEklsObservationKind[] {
  return ANALYTICS_EKLS_OBSERVATION_KINDS;
}
