/**
 * G7-07 — Autonomous operations EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import { AUTONOMOUS_EKLS_KINDS, type AutonomousEklsKind } from "../contracts/autonomous-operations-types.js";
import { validateAutonomousOperationsPillowGovernance } from "../governance/autonomous-operations-pillow-governance.js";
import {
  appendAutonomousObservation,
  searchAutonomousObservations,
} from "./autonomous-operations-observation-store.js";

export function recordAutonomousEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  autonomousOperationId: string;
  ownerId: string;
  kind: AutonomousEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateAutonomousOperationsPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "execute",
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
      consumerChannel: "grand-king-autonomous-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(AUTONOMOUS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendAutonomousObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    autonomousOperationId: input.autonomousOperationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Autonomous operations EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchAutonomousEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  autonomousOperationId?: string;
  kind?: AutonomousEklsKind;
  pillowGovernance: true;
}) {
  return searchAutonomousObservations(input);
}

export function listAutonomousEklsKinds(): readonly AutonomousEklsKind[] {
  return AUTONOMOUS_EKLS_KINDS;
}
