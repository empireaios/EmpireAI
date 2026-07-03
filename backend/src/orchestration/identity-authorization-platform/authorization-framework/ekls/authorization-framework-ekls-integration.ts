/**
 * G8-02 — Authorization framework EKLS integration.
 */

import { randomUUID } from "node:crypto";
import {
  AUTHORIZATION_FRAMEWORK_EKLS_KINDS,
  type AuthorizationFrameworkEklsKind,
} from "../contracts/authorization-framework-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateAuthorizationFrameworkPillowGovernance } from "../governance/authorization-framework-pillow-governance.js";
import {
  appendAuthorizationFrameworkObservation,
  searchAuthorizationFrameworkObservations,
} from "./authorization-framework-observation-store.js";

export function recordAuthorizationFrameworkEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  authorizationId?: string;
  providerId?: string;
  kind: AuthorizationFrameworkEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateAuthorizationFrameworkPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
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
      consumerChannel: "authorization-framework",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(AUTHORIZATION_FRAMEWORK_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown authorization EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendAuthorizationFrameworkObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    authorizationId: input.authorizationId,
    providerId: input.providerId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Authorization framework EKLS learning event recorded",
    eklsGoverned: true,
  };
}

export function searchAuthorizationFrameworkEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  authorizationId?: string;
  providerId?: string;
  kind?: AuthorizationFrameworkEklsKind;
  pillowGovernance: true;
}) {
  return searchAuthorizationFrameworkObservations(input);
}

export function listAuthorizationFrameworkEklsKinds(): readonly AuthorizationFrameworkEklsKind[] {
  return AUTHORIZATION_FRAMEWORK_EKLS_KINDS;
}
