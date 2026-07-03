/**
 * G8-01 — Connection registry EKLS integration.
 */

import { randomUUID } from "node:crypto";
import {
  CONNECTION_REGISTRY_EKLS_KINDS,
  type ConnectionRegistryEklsKind,
} from "../../../../registry/types/connection-registry-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateConnectionRegistryPillowGovernance } from "../governance/connection-registry-pillow-governance.js";
import {
  appendConnectionRegistryObservation,
  searchConnectionRegistryObservations,
} from "./connection-registry-observation-store.js";

export function recordConnectionRegistryEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  kind: ConnectionRegistryEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateConnectionRegistryPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    operation: "resolve",
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
      consumerChannel: "connection-registry",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(CONNECTION_REGISTRY_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown connection registry EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendConnectionRegistryObservation({
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
    reason: "Connection registry EKLS learning event recorded",
    eklsGoverned: true,
  };
}

export function searchConnectionRegistryEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: ConnectionRegistryEklsKind;
  pillowGovernance: true;
}) {
  return searchConnectionRegistryObservations(input);
}

export function listConnectionRegistryEklsKinds(): readonly ConnectionRegistryEklsKind[] {
  return CONNECTION_REGISTRY_EKLS_KINDS;
}
