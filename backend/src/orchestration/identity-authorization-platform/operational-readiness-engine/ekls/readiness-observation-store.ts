/**
 * G8-06 — Readiness EKLS observation store.
 */

import type { ReadinessEklsKind } from "../contracts/readiness-types.js";

export type ReadinessEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  providerId?: string;
  kind: ReadinessEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: ReadinessEklsObservationRecord[] = [];

export function resetReadinessObservationStoreForTests(): void {
  store = [];
}

export function appendReadinessObservation(record: ReadinessEklsObservationRecord): void {
  store.push(record);
}

export function searchReadinessObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: ReadinessEklsKind;
  pillowGovernance: true;
}): ReadinessEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
