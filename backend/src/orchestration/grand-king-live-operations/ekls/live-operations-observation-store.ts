/**
 * G7-00 — Live operations EKLS observation store.
 */

import type { LiveOperationsEklsKind } from "../contracts/live-operations-types.js";

export type LiveOperationsEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  operationId: string;
  kind: LiveOperationsEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: LiveOperationsEklsObservationRecord[] = [];

export function resetLiveOperationsObservationStoreForTests(): void {
  store = [];
}

export function appendLiveOperationsObservation(record: LiveOperationsEklsObservationRecord): void {
  store.push(record);
}

export function searchLiveOperationsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  operationId?: string;
  kind?: LiveOperationsEklsKind;
  pillowGovernance: true;
}): LiveOperationsEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.operationId && record.operationId !== input.operationId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
