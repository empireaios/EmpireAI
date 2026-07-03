/**
 * G6-00 — Certification EKLS integration.
 */

import { randomUUID } from "node:crypto";
import type { CertificationEklsObservationKind } from "../contracts/production-certification-types.js";
import { validateCertificationPillowGovernance } from "../governance/certification-pillow-governance.js";
import {
  validateCertificationEklsGovernance,
  validateCertificationObservationRecord,
} from "./certification-ekls-pillow-governance.js";
import {
  getCertificationObservationStore,
  type CertificationEklsObservationRecord,
} from "./certification-observation-store.js";

export function recordCertificationEklsObservation(input: {
  actorId: string;
  workspaceId: string;
  runId: string;
  kind: CertificationEklsObservationKind;
  summary: string;
  signalValue?: number;
  pillowGovernance: true;
}): { accepted: boolean; observationId?: string; reason: string; eklsGoverned: boolean } {
  const pillow = validateCertificationPillowGovernance({
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "run_full",
    pillowGovernance: true,
  });
  if (!pillow.allowed) {
    return { accepted: false, reason: pillow.reason, eklsGoverned: false };
  }

  const governance = validateCertificationEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "store",
  });
  if (!governance.allowed) {
    return { accepted: false, reason: governance.reason, eklsGoverned: false };
  }

  const record: CertificationEklsObservationRecord = {
    observationId: randomUUID(),
    runId: input.runId,
    workspaceId: input.workspaceId,
    actorId: input.actorId,
    kind: input.kind,
    summary: input.summary,
    signalValue: input.signalValue ?? 1,
    recordedAt: new Date().toISOString(),
    pillowGoverned: true,
    eklsChannel: "production-certification",
  };

  const quality = validateCertificationObservationRecord(record);
  if (!quality.allowed) {
    return { accepted: false, reason: quality.reason, eklsGoverned: governance.eklsGoverned };
  }

  getCertificationObservationStore().save(record);
  return {
    accepted: true,
    observationId: record.observationId,
    reason: "Certification observation recorded through Pillow-governed EKLS",
    eklsGoverned: true,
  };
}

export function searchCertificationEklsObservations(input: {
  actorId: string;
  workspaceId: string;
  runId?: string;
  kind?: CertificationEklsObservationKind;
  pillowGovernance: true;
}): CertificationEklsObservationRecord[] {
  const governance = validateCertificationEklsGovernance({
    pillowGovernance: true,
    actorId: input.actorId,
    workspaceId: input.workspaceId,
    operation: "search",
  });
  if (!governance.allowed) return [];

  return getCertificationObservationStore()
    .list(input.workspaceId, input.runId)
    .filter((record) => (input.kind ? record.kind === input.kind : true));
}
