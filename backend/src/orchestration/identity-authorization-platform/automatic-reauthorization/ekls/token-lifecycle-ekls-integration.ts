/**
 * G8-07 — Token lifecycle EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { TOKEN_LIFECYCLE_EKLS_KINDS, type TokenLifecycleEklsKind } from "../contracts/token-lifecycle-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateTokenLifecyclePillowGovernance } from "../governance/token-lifecycle-pillow-governance.js";
import { appendTokenLifecycleObservation, searchTokenLifecycleObservations } from "./token-lifecycle-observation-store.js";

export function recordTokenLifecycleEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  reauthorizationId?: string;
  kind: TokenLifecycleEklsKind;
  summary: string;
  pillowGovernance: true;
}) {
  const pillow = validateTokenLifecyclePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    operation: "scan",
    pillowGovernance: true,
  });
  if (!pillow.allowed) return { accepted: false, reason: pillow.reason, eklsGoverned: false };

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "automatic-reauthorization",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return { accepted: false, reason: ekls.reason, eklsGoverned: false };

  if (!(TOKEN_LIFECYCLE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown token lifecycle EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendTokenLifecycleObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    reauthorizationId: input.reauthorizationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Token lifecycle EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchTokenLifecycleEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: TokenLifecycleEklsKind;
  pillowGovernance: true;
}) {
  return searchTokenLifecycleObservations(input);
}

export function listTokenLifecycleEklsKinds(): readonly TokenLifecycleEklsKind[] {
  return TOKEN_LIFECYCLE_EKLS_KINDS;
}
