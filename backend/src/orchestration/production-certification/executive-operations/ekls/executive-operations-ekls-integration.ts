/**
 * G6-07 — Executive operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  EXECUTIVE_OPERATIONS_EKLS_KINDS,
  type ExecutiveOperationsEklsKind,
} from "../contracts/executive-operations-types.js";
import { validateExecutiveOperationsPillowGovernance } from "../governance/executive-operations-pillow-governance.js";
import {
  getExecutiveOperationsObservationStore,
  type ExecutiveOperationsEklsObservationRecord,
} from "./executive-operations-observation-store.js";

export function recordExecutiveOperationsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: ExecutiveOperationsEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateExecutiveOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "executive_scan",
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

  if (!(EXECUTIVE_OPERATIONS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown executive EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: ExecutiveOperationsEklsObservationRecord = {
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

  getExecutiveOperationsObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Executive operations observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchExecutiveOperationsEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: ExecutiveOperationsEklsKind;
  pillowGovernance: true;
}): ExecutiveOperationsEklsObservationRecord[] {
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

  return getExecutiveOperationsObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listExecutiveOperationsEklsKinds(): readonly ExecutiveOperationsEklsKind[] {
  return EXECUTIVE_OPERATIONS_EKLS_KINDS;
}
