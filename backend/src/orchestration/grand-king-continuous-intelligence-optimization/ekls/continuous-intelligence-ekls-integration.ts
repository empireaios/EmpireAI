/**
 * G7-06 — Continuous intelligence EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  OPTIMIZATION_EKLS_KINDS,
  type OptimizationEklsKind,
} from "../contracts/continuous-intelligence-types.js";
import { validateContinuousIntelligencePillowGovernance } from "../governance/continuous-intelligence-pillow-governance.js";
import {
  appendOptimizationObservation,
  searchOptimizationObservations,
} from "./continuous-intelligence-observation-store.js";

export function recordOptimizationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  optimizationId: string;
  ownerId: string;
  kind: OptimizationEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateContinuousIntelligencePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "recommend",
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
      consumerChannel: "grand-king-continuous-intelligence-optimization",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(OPTIMIZATION_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendOptimizationObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    optimizationId: input.optimizationId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return {
    accepted: true,
    observationId,
    reason: "Continuous intelligence EKLS observation recorded",
    eklsGoverned: true,
  };
}

export function searchOptimizationEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  optimizationId?: string;
  kind?: OptimizationEklsKind;
  pillowGovernance: true;
}) {
  return searchOptimizationObservations(input);
}

export function listOptimizationEklsKinds(): readonly OptimizationEklsKind[] {
  return OPTIMIZATION_EKLS_KINDS;
}
