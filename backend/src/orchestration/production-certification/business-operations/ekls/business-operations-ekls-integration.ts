/**
 * G6-05 — Business operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  BUSINESS_OPERATIONS_EKLS_KINDS,
  type BusinessOperationsEklsKind,
} from "../contracts/business-operations-types.js";
import { validateBusinessOperationsPillowGovernance } from "../governance/business-operations-pillow-governance.js";
import {
  getBusinessOperationsObservationStore,
  type BusinessOperationsEklsObservationRecord,
} from "./business-operations-observation-store.js";

export function recordBusinessOperationsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: BusinessOperationsEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateBusinessOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "business_scan",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(BUSINESS_OPERATIONS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown business EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: BusinessOperationsEklsObservationRecord = {
    observationId: randomUUID(),
    scanId: input.scanId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    signalValue: input.signalValue ?? 1,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
    eklsChannel: "production-certification",
  };

  getBusinessOperationsObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Business operations observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchBusinessOperationsEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: BusinessOperationsEklsKind;
  pillowGovernance: true;
}): BusinessOperationsEklsObservationRecord[] {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "search",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return [];

  return getBusinessOperationsObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listBusinessOperationsEklsKinds(): readonly BusinessOperationsEklsKind[] {
  return BUSINESS_OPERATIONS_EKLS_KINDS;
}
