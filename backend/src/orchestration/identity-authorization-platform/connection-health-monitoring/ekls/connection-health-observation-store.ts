/**
 * G8-04 — Connection health EKLS observation store (metadata only).
 */

import type { ConnectionHealthEklsKind } from "../contracts/connection-health-types.js";

export type ConnectionHealthEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  providerId?: string;
  connectionId?: string;
  healthCheckId?: string;
  kind: ConnectionHealthEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: ConnectionHealthEklsObservationRecord[] = [];

export function resetConnectionHealthObservationStoreForTests(): void {
  store = [];
}

export function appendConnectionHealthObservation(record: ConnectionHealthEklsObservationRecord): void {
  store.push(record);
}

export function searchConnectionHealthObservations(input: {
  actorId?: string;
  workspaceId?: string;
  providerId?: string;
  connectionId?: string;
  kind?: ConnectionHealthEklsKind;
  pillowGovernance: true;
}): ConnectionHealthEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.connectionId && record.connectionId !== input.connectionId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
