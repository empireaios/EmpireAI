/**
 * G6-10 — Final readiness EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  FINAL_READINESS_EKLS_KINDS,
  type FinalReadinessEklsKind,
} from "../contracts/final-production-readiness-types.js";
import { validateFinalReadinessPillowGovernance } from "../governance/final-readiness-pillow-governance.js";
import {
  appendFinalReadinessObservation,
  searchFinalReadinessObservations,
} from "./final-readiness-observation-store.js";

export function recordFinalReadinessEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  runId: string;
  kind: FinalReadinessEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateFinalReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_final",
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
      consumerChannel: "production-certification",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(FINAL_READINESS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendFinalReadinessObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    runId: input.runId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return { accepted: true, observationId, reason: "Final readiness EKLS observation recorded", eklsGoverned: true };
}

export function searchFinalReadinessEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: FinalReadinessEklsKind;
  pillowGovernance: true;
}) {
  return searchFinalReadinessObservations(input);
}

export function listFinalReadinessEklsKinds(): readonly FinalReadinessEklsKind[] {
  return FINAL_READINESS_EKLS_KINDS;
}
