/**
 * G8-04 — Connection health EKLS integration (non-secret audit records only).
 */

import { randomUUID } from "node:crypto";
import {
  CONNECTION_HEALTH_EKLS_KINDS,
  type ConnectionHealthEklsKind,
} from "../contracts/connection-health-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateConnectionHealthPillowGovernance } from "../governance/connection-health-pillow-governance.js";
import {
  appendConnectionHealthObservation,
  searchConnectionHealthObservations,
} from "./connection-health-observation-store.js";

export function recordConnectionHealthEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  accountHolderId: string;
  providerId?: string;
  connectionId?: string;
  healthCheckId?: string;
  kind: ConnectionHealthEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateConnectionHealthPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    accountHolderId: input.accountHolderId,
    providerId: input.providerId,
    operation: "check",
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
      consumerChannel: "connection-health-monitoring",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(CONNECTION_HEALTH_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown connection health EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendConnectionHealthObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    providerId: input.providerId,
    connectionId: input.connectionId,
    healthCheckId: input.healthCheckId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Connection health EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchConnectionHealthEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  connectionId?: string;
  kind?: ConnectionHealthEklsKind;
  pillowGovernance: true;
}) {
  return searchConnectionHealthObservations(input);
}

export function listConnectionHealthEklsKinds(): readonly ConnectionHealthEklsKind[] {
  return CONNECTION_HEALTH_EKLS_KINDS;
}
