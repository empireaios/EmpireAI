/**
 * G7-00 — Live operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  LIVE_OPERATIONS_EKLS_KINDS,
  type LiveOperationsEklsKind,
} from "../contracts/live-operations-types.js";
import { validateLiveOperationsPillowGovernance } from "../governance/live-operations-pillow-governance.js";
import {
  appendLiveOperationsObservation,
  searchLiveOperationsObservations,
} from "./live-operations-observation-store.js";

export function recordLiveOperationsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  operationId: string;
  accountHolderId: string;
  kind: LiveOperationsEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateLiveOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    operation: "start",
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
      consumerChannel: "grand-king-live-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(LIVE_OPERATIONS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendLiveOperationsObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operationId: input.operationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return { accepted: true, observationId, reason: "Live operation EKLS observation recorded", eklsGoverned: true };
}

export function searchLiveOperationsEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  operationId?: string;
  kind?: LiveOperationsEklsKind;
  pillowGovernance: true;
}) {
  return searchLiveOperationsObservations(input);
}

export function listLiveOperationsEklsKinds(): readonly LiveOperationsEklsKind[] {
  return LIVE_OPERATIONS_EKLS_KINDS;
}
