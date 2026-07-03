/**
 * G8-03 — Credential vault EKLS observation store (metadata only).
 */

import type { CredentialVaultEklsKind } from "../contracts/credential-vault-types.js";

export type CredentialVaultEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  credentialRefId?: string;
  providerId?: string;
  kind: CredentialVaultEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: CredentialVaultEklsObservationRecord[] = [];

export function resetCredentialVaultObservationStoreForTests(): void {
  store = [];
}

export function appendCredentialVaultObservation(record: CredentialVaultEklsObservationRecord): void {
  store.push(record);
}

export function searchCredentialVaultObservations(input: {
  actorId?: string;
  workspaceId?: string;
  credentialRefId?: string;
  providerId?: string;
  kind?: CredentialVaultEklsKind;
  pillowGovernance: true;
}): CredentialVaultEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.credentialRefId && record.credentialRefId !== input.credentialRefId) return false;
    if (input.providerId && record.providerId !== input.providerId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
