/**
 * G7-04 — Executive decision EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  EXECUTIVE_DECISION_EKLS_KINDS,
  type ExecutiveDecisionEklsKind,
} from "../contracts/executive-decision-types.js";
import { validateExecutiveDecisionPillowGovernance } from "../governance/executive-decision-pillow-governance.js";
import {
  appendExecutiveDecisionObservation,
  searchExecutiveDecisionObservations,
} from "./executive-decision-observation-store.js";

export function recordExecutiveDecisionEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  decisionId: string;
  ownerId: string;
  kind: ExecutiveDecisionEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateExecutiveDecisionPillowGovernance({
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
      consumerChannel: "grand-king-executive-decision-centre",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(EXECUTIVE_DECISION_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendExecutiveDecisionObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    decisionId: input.decisionId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Executive decision EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchExecutiveDecisionEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  decisionId?: string;
  kind?: ExecutiveDecisionEklsKind;
  pillowGovernance: true;
}) {
  return searchExecutiveDecisionObservations(input);
}

export function listExecutiveDecisionEklsKinds(): readonly ExecutiveDecisionEklsKind[] {
  return EXECUTIVE_DECISION_EKLS_KINDS;
}
