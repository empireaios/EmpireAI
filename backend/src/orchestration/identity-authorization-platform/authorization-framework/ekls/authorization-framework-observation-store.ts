/**
 * G8-02 — Authorization framework EKLS observation store.
 */

import type { AuthorizationFrameworkEklsKind } from "../contracts/authorization-framework-types.js";

export type AuthorizationFrameworkEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  authorizationId?: string;
  providerId?: string;
  kind: AuthorizationFrameworkEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: AuthorizationFrameworkEklsObservationRecord[] = [];

export function resetAuthorizationFrameworkObservationStoreForTests(): void {
  store = [];
}

export function appendAuthorizationFrameworkObservation(
  record: AuthorizationFrameworkEklsObservationRecord,
): void {
  store.push(record);
}

export function searchAuthorizationFrameworkObservations(input: {
  actorId?: string;
  workspaceId?: string;
  authorizationId?: string;
  providerId?: string;
  kind?: AuthorizationFrameworkEklsKind;
  pillowGovernance: true;
}): AuthorizationFrameworkEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.authorizationId && record.authorizationId !== input.authorizationId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
