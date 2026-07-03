/**
 * G7-08 — Self-healing EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import { SELF_HEALING_EKLS_KINDS, type SelfHealingEklsKind } from "../contracts/self-healing-types.js";
import { validateSelfHealingPillowGovernance } from "../governance/self-healing-pillow-governance.js";
import { appendSelfHealingObservation, searchSelfHealingObservations } from "./self-healing-observation-store.js";

export function recordSelfHealingEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  healingId: string;
  ownerId: string;
  kind: SelfHealingEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateSelfHealingPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "heal",
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
      consumerChannel: "grand-king-self-healing-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(SELF_HEALING_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendSelfHealingObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    healingId: input.healingId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Self-healing EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchSelfHealingEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  healingId?: string;
  kind?: SelfHealingEklsKind;
  pillowGovernance: true;
}) {
  return searchSelfHealingObservations(input);
}

export function listSelfHealingEklsKinds(): readonly SelfHealingEklsKind[] {
  return SELF_HEALING_EKLS_KINDS;
}
