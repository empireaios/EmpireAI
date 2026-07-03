/**
 * G7-09 — Operational intelligence EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  OPERATIONAL_INTELLIGENCE_EKLS_KINDS,
  type OperationalIntelligenceEklsKind,
} from "../contracts/operational-intelligence-types.js";
import { validateOperationalIntelligencePillowGovernance } from "../governance/operational-intelligence-pillow-governance.js";
import {
  appendOperationalIntelligenceObservation,
  searchOperationalIntelligenceObservations,
} from "./operational-intelligence-observation-store.js";

export function recordOperationalIntelligenceEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  insightId: string;
  ownerId: string;
  kind: OperationalIntelligenceEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateOperationalIntelligencePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "insight",
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
      consumerChannel: "grand-king-operational-intelligence-executive-insights",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(OPERATIONAL_INTELLIGENCE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendOperationalIntelligenceObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    insightId: input.insightId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Operational intelligence EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchOperationalIntelligenceEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  insightId?: string;
  kind?: OperationalIntelligenceEklsKind;
  pillowGovernance: true;
}) {
  return searchOperationalIntelligenceObservations(input);
}

export function listOperationalIntelligenceEklsKinds(): readonly OperationalIntelligenceEklsKind[] {
  return OPERATIONAL_INTELLIGENCE_EKLS_KINDS;
}
