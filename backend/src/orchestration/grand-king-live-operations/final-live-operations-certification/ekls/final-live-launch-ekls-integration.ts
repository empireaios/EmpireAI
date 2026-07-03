/**
 * G7-10 — Final live launch EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  FINAL_LIVE_LAUNCH_EKLS_KINDS,
  type FinalLiveLaunchEklsKind,
} from "../contracts/final-live-operations-certification-types.js";
import { validateFinalLiveLaunchPillowGovernance } from "../governance/final-live-launch-pillow-governance.js";
import { appendFinalLiveLaunchObservation, searchFinalLiveLaunchObservations } from "./final-live-launch-observation-store.js";

export function recordFinalLiveLaunchEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  runId: string;
  ownerId: string;
  kind: FinalLiveLaunchEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateFinalLiveLaunchPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "run_launch",
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
      consumerChannel: "grand-king-live-operations",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(FINAL_LIVE_LAUNCH_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendFinalLiveLaunchObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId: input.runId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Final live launch EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchFinalLiveLaunchEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  runId?: string;
  kind?: FinalLiveLaunchEklsKind;
  pillowGovernance: true;
}) {
  return searchFinalLiveLaunchObservations(input);
}

export function listFinalLiveLaunchEklsKinds(): readonly FinalLiveLaunchEklsKind[] {
  return FINAL_LIVE_LAUNCH_EKLS_KINDS;
}
