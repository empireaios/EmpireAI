/**
 * G8-08 — Isolation EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { ISOLATION_EKLS_KINDS, type IsolationEklsKind } from "../contracts/isolation-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateIsolationPillowGovernance } from "../governance/isolation-pillow-governance.js";
import { appendIsolationObservation, searchIsolationObservations } from "./isolation-observation-store.js";

export function recordIsolationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId?: string;
  providerId?: string;
  kind: IsolationEklsKind;
  summary: string;
  pillowGovernance: true;
}) {
  const pillow = validateIsolationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    operation: "enforce",
    pillowGovernance: true,
  });
  if (!pillow.allowed) return { accepted: false, reason: pillow.reason, eklsGoverned: false };

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "multi-workspace-isolation",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return { accepted: false, reason: ekls.reason, eklsGoverned: false };

  if (!(ISOLATION_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown isolation EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendIsolationObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Isolation EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchIsolationEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: IsolationEklsKind;
  pillowGovernance: true;
}) {
  return searchIsolationObservations(input);
}

export function listIsolationEklsKinds(): readonly IsolationEklsKind[] {
  return ISOLATION_EKLS_KINDS;
}
