/**
 * G6-04 — Operational readiness EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  OPERATIONAL_READINESS_EKLS_KINDS,
  type OperationalReadinessEklsKind,
} from "../contracts/operational-readiness-types.js";
import { validateOperationalReadinessPillowGovernance } from "../governance/operational-readiness-pillow-governance.js";
import {
  getOperationalReadinessObservationStore,
  type OperationalReadinessEklsObservationRecord,
} from "./operational-readiness-observation-store.js";

export function recordOperationalReadinessEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: OperationalReadinessEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateOperationalReadinessPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "operational_scan",
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

  if (!(OPERATIONAL_READINESS_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown operational EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: OperationalReadinessEklsObservationRecord = {
    observationId: randomUUID(),
    scanId: input.scanId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    signalValue: input.signalValue ?? 1,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
    eklsChannel: "production-certification",
  };

  getOperationalReadinessObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Operational readiness observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchOperationalReadinessEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: OperationalReadinessEklsKind;
  pillowGovernance: true;
}): OperationalReadinessEklsObservationRecord[] {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: "search",
    },
    input.workspaceId,
  );
  if (!ekls.allowed) return [];

  return getOperationalReadinessObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listOperationalReadinessEklsKinds(): readonly OperationalReadinessEklsKind[] {
  return OPERATIONAL_READINESS_EKLS_KINDS;
}
