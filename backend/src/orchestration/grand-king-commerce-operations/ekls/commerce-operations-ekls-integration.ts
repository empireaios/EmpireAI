/**
 * G7-02 — Commerce operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  COMMERCE_OPERATIONS_EKLS_KINDS,
  type CommerceOperationsEklsKind,
} from "../contracts/commerce-operations-types.js";
import { validateCommerceOperationsPillowGovernance } from "../governance/commerce-operations-pillow-governance.js";
import {
  appendCommerceOperationsObservation,
  searchCommerceOperationsObservations,
} from "./commerce-operations-observation-store.js";

export function recordCommerceOperationsEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  operationId: string;
  ownerId: string;
  kind: CommerceOperationsEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateCommerceOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
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
      consumerChannel: "grand-king-commerce-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(COMMERCE_OPERATIONS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendCommerceOperationsObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operationId: input.operationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Commerce operations EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchCommerceOperationsEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  operationId?: string;
  kind?: CommerceOperationsEklsKind;
  pillowGovernance: true;
}) {
  return searchCommerceOperationsObservations(input);
}

export function listCommerceOperationsEklsKinds(): readonly CommerceOperationsEklsKind[] {
  return COMMERCE_OPERATIONS_EKLS_KINDS;
}
