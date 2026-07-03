/**
 * G8-01 — Connection registry EKLS observation store.
 */

import type { ConnectionRegistryEklsKind } from "../../../../registry/types/connection-registry-types.js";

export type ConnectionRegistryEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  providerId?: string;
  kind: ConnectionRegistryEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: ConnectionRegistryEklsObservationRecord[] = [];

export function resetConnectionRegistryObservationStoreForTests(): void {
  store = [];
}

export function appendConnectionRegistryObservation(record: ConnectionRegistryEklsObservationRecord): void {
  store.push(record);
}

export function searchConnectionRegistryObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  kind?: ConnectionRegistryEklsKind;
  pillowGovernance: true;
}): ConnectionRegistryEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
