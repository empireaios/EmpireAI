/**
 * G8-07 — Token lifecycle EKLS observation store.
 */

import type { TokenLifecycleEklsKind } from "../contracts/token-lifecycle-types.js";

export type TokenLifecycleEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  providerId?: string;
  reauthorizationId?: string;
  kind: TokenLifecycleEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: TokenLifecycleEklsObservationRecord[] = [];

export function resetTokenLifecycleObservationStoreForTests(): void {
  store = [];
}

export function appendTokenLifecycleObservation(record: TokenLifecycleEklsObservationRecord): void {
  store.push(record);
}

export function searchTokenLifecycleObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: TokenLifecycleEklsKind;
  pillowGovernance: true;
}): TokenLifecycleEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
