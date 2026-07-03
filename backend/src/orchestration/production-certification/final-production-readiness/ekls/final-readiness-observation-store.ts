/**
 * G6-10 — Final readiness EKLS observation store.
 */

import type { FinalReadinessEklsKind } from "../contracts/final-production-readiness-types.js";

export type FinalReadinessEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  runId: string;
  kind: FinalReadinessEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: FinalReadinessEklsObservationRecord[] = [];

export function getFinalReadinessObservationStore(): FinalReadinessEklsObservationRecord[] {
  return store;
}

export function resetFinalReadinessObservationStoreForTests(): void {
  store = [];
}

export function appendFinalReadinessObservation(
  record: FinalReadinessEklsObservationRecord,
): void {
  store.push(record);
}

export function searchFinalReadinessObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: FinalReadinessEklsKind;
  pillowGovernance: true;
}): FinalReadinessEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
