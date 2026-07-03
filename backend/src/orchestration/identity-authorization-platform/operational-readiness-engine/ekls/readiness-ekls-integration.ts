/**
 * G8-06 — Readiness EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { READINESS_EKLS_KINDS, type ReadinessEklsKind } from "../contracts/readiness-types.js";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import { validateReadinessPillowGovernance } from "../governance/readiness-pillow-governance.js";
import { appendReadinessObservation, searchReadinessObservations } from "./readiness-observation-store.js";

export function recordReadinessEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  providerId?: string;
  kind: ReadinessEklsKind;
  summary: string;
  pillowGovernance: true;
}) {
  const pillow = validateReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    providerId: input.providerId,
    operation: "evaluate",
    pillowGovernance: true,
  });
  if (!pillow.allowed) return { accepted: false, reason: pillow.reason, eklsGoverned: false };

  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "operational-readiness-engine",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return { accepted: false, reason: ekls.reason, eklsGoverned: false };

  if (!(READINESS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown readiness EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendReadinessObservation({
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
    reason: "Readiness EKLS audit record stored (metadata only)",
    eklsGoverned: true,
  };
}

export function searchReadinessEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: ReadinessEklsKind;
  pillowGovernance: true;
}) {
  return searchReadinessObservations(input);
}

export function listReadinessEklsKinds(): readonly ReadinessEklsKind[] {
  return READINESS_EKLS_KINDS;
}
