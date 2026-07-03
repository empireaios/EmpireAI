/**
 * G8-00 — Identity authorization EKLS observation store.
 */

import type { IdentityLearningRecordKind } from "../contracts/identity-authorization-types.js";

export type IdentityAuthorizationEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  providerId?: string;
  kind: IdentityLearningRecordKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: IdentityAuthorizationEklsObservationRecord[] = [];

export function resetIdentityAuthorizationObservationStoreForTests(): void {
  store = [];
}

export function appendIdentityAuthorizationObservation(
  record: IdentityAuthorizationEklsObservationRecord,
): void {
  store.push(record);
}

export function searchIdentityAuthorizationObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: IdentityLearningRecordKind;
  pillowGovernance: true;
}): IdentityAuthorizationEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
