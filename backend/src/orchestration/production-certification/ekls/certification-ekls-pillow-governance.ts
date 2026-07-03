/**
 * G6-00 — Certification EKLS Pillow governance.
 */

import { enforceEklsAccess } from "../../pillow/ekls/services/ekls-governance-gateway.js";
import {
  CERTIFICATION_EKLS_OBSERVATION_KINDS,
  type CertificationEklsObservationKind,
} from "../contracts/production-certification-types.js";
import type { CertificationEklsObservationRecord } from "./certification-observation-store.js";

export function validateCertificationEklsGovernance(input: {
  pillowGovernance: true;
  actorId: string;
  workspaceId: string;
  operation: "store" | "search";
}): { allowed: boolean; reason: string; eklsGoverned: boolean } {
  const ekls = enforceEklsAccess(
    {
      pillowGovernance: true,
      actorId: input.actorId,
      workspaceId: input.workspaceId,
      consumerChannel: "production-certification",
      operation: input.operation,
    },
    input.workspaceId,
  );
  if (!ekls.allowed) {
    return { allowed: false, reason: ekls.reason, eklsGoverned: false };
  }
  return { allowed: true, reason: "Certification EKLS governance validated", eklsGoverned: true };
}

export function validateCertificationObservationRecord(
  record: CertificationEklsObservationRecord,
): { allowed: boolean; reason: string } {
  if (!(CERTIFICATION_EKLS_OBSERVATION_KINDS as readonly string[]).includes(record.kind)) {
    return { allowed: false, reason: `Unknown observation kind: ${record.kind}` };
  }
  return { allowed: true, reason: "Observation record validated" };
}

export function listCertificationEklsObservationKinds(): readonly CertificationEklsObservationKind[] {
  return CERTIFICATION_EKLS_OBSERVATION_KINDS;
}
