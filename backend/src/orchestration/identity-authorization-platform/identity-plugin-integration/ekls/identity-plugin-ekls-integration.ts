/**
 * G8-09 — Identity plugin EKLS integration.
 */

import { randomUUID } from "node:crypto";
import {
  IDENTITY_PLUGIN_EKLS_KINDS,
  type IdentityPluginEklsKind,
} from "../contracts/identity-plugin-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateIdentityPluginLifecycleGovernance } from "../governance/identity-plugin-pillow-governance.js";
import {
  appendIdentityPluginObservation,
  searchIdentityPluginObservations,
} from "./identity-plugin-observation-store.js";

export function recordIdentityPluginEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  pluginId: string;
  kind: IdentityPluginEklsKind;
  summary: string;
  pillowGovernance: true;
}) {
  const pillow = validateIdentityPluginLifecycleGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "register",
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
      consumerChannel: "identity-plugin-integration",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(IDENTITY_PLUGIN_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown identity plugin EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendIdentityPluginObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    pluginId: input.pluginId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Identity plugin EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchIdentityPluginEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  pluginId?: string;
  kind?: IdentityPluginEklsKind;
  pillowGovernance: true;
}) {
  return searchIdentityPluginObservations(input);
}

export function listIdentityPluginEklsKinds(): readonly IdentityPluginEklsKind[] {
  return IDENTITY_PLUGIN_EKLS_KINDS;
}
