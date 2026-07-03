/**
 * G6-08 — Failure recovery EKLS integration.
 */

import { randomUUID } from "node:crypto";
import { enforceEklsAccess } from "../../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  FAILURE_RECOVERY_EKLS_KINDS,
  type FailureRecoveryEklsKind,
} from "../contracts/failure-recovery-incident-types.js";
import { validateFailureRecoveryPillowGovernance } from "../governance/failure-recovery-pillow-governance.js";
import {
  getFailureRecoveryObservationStore,
  type FailureRecoveryEklsObservationRecord,
} from "./failure-recovery-observation-store.js";

export function recordFailureRecoveryEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  scanId: string;
  kind: FailureRecoveryEklsKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateFailureRecoveryPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "failure_recovery_scan",
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

  if (!(FAILURE_RECOVERY_EKLS_KINDS as readonly string[]).includes(input.kind)) {
    return { accepted: false, reason: `Unknown failure recovery EKLS kind: ${input.kind}`, eklsGoverned: false };
  }

  const record: FailureRecoveryEklsObservationRecord = {
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

  getFailureRecoveryObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Failure recovery observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchFailureRecoveryEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  scanId?: string;
  kind?: FailureRecoveryEklsKind;
  pillowGovernance: true;
}): FailureRecoveryEklsObservationRecord[] {
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

  return getFailureRecoveryObservationStore()
    .list(input.workspaceId, input.scanId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}

export function listFailureRecoveryEklsKinds(): readonly FailureRecoveryEklsKind[] {
  return FAILURE_RECOVERY_EKLS_KINDS;
}
