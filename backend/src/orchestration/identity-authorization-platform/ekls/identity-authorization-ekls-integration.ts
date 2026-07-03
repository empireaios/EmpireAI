/**
 * G8-00 — Identity authorization EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  IDENTITY_LEARNING_RECORD_KINDS,
  type IdentityLearningRecordKind,
} from "../contracts/identity-authorization-types.js";
import { validateIdentityAuthorizationPillowGovernance } from "../governance/identity-authorization-pillow-governance.js";
import {
  appendIdentityAuthorizationObservation,
  searchIdentityAuthorizationObservations,
} from "./identity-authorization-observation-store.js";

export function recordIdentityAuthorizationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  kind: IdentityLearningRecordKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateIdentityAuthorizationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    operation: "load",
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
      consumerChannel: "identity-authorization",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(IDENTITY_LEARNING_RECORD_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown identity learning record kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendIdentityAuthorizationObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Identity authorization EKLS learning record recorded",
    eklsGoverned: true,
  };
}

export function searchIdentityAuthorizationEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: IdentityLearningRecordKind;
  pillowGovernance: true;
}) {
  return searchIdentityAuthorizationObservations(input);
}

export function listIdentityAuthorizationEklsKinds(): readonly IdentityLearningRecordKind[] {
  return IDENTITY_LEARNING_RECORD_KINDS;
}
