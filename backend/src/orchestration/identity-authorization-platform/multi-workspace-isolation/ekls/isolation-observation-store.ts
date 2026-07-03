/**
 * G8-08 — Isolation EKLS observation store.
 */

import type { IsolationEklsKind } from "../contracts/isolation-types.js";

export type IsolationEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  accountHolderId?: string;
  providerId?: string;
  kind: IsolationEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: IsolationEklsObservationRecord[] = [];

export function resetIsolationObservationStoreForTests(): void {
  store = [];
}

export function appendIsolationObservation(record: IsolationEklsObservationRecord): void {
  store.push(record);
}

export function searchIsolationObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: IsolationEklsKind;
  pillowGovernance: true;
}): IsolationEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
