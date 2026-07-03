/**
 * G7-01 — Production workspace EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  PRODUCTION_WORKSPACE_EKLS_KINDS,
  type ProductionWorkspaceEklsKind,
} from "../contracts/production-workspace-types.js";
import { validateProductionWorkspacePillowGovernance } from "../governance/production-workspace-pillow-governance.js";
import {
  appendProductionWorkspaceObservation,
  searchProductionWorkspaceObservations,
} from "./production-workspace-observation-store.js";

export function recordProductionWorkspaceEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  ownerId: string;
  kind: ProductionWorkspaceEklsKind;
  summary: string;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateProductionWorkspacePillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    ownerId: input.ownerId,
    operation: "configure",
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
      consumerChannel: "grand-king-production-workspace",
      operation: "store",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { accepted: false, reason: ekls.reason, eklsGoverned: false };
  }

  if (!(PRODUCTION_WORKSPACE_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown EKLS kind: ${input.kind}`, eklsGoverned: true };
  }

  const observationId = randomUUID();
  appendProductionWorkspaceObservation({
    observationId,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    kind: input.kind,
    summary: input.summary,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
  });

  return { accepted: true, observationId, reason: "Production workspace EKLS observation recorded", eklsGoverned: true };
}

export function searchProductionWorkspaceEklsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: ProductionWorkspaceEklsKind;
  pillowGovernance: true;
}) {
  return searchProductionWorkspaceObservations(input);
}

export function listProductionWorkspaceEklsKinds(): readonly ProductionWorkspaceEklsKind[] {
  return PRODUCTION_WORKSPACE_EKLS_KINDS;
}
