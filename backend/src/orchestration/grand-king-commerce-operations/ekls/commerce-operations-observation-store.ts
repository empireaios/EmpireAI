/**
 * G7-02 — Commerce operations EKLS observation store.
 */

import type { CommerceOperationsEklsKind } from "../contracts/commerce-operations-types.js";

export type CommerceOperationsObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  operationId: string;
  kind: CommerceOperationsEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: CommerceOperationsObservation[] = [];

export function appendCommerceOperationsObservation(observation: CommerceOperationsObservation): void {
  observations.push(observation);
}

export function searchCommerceOperationsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  operationId?: string;
  kind?: CommerceOperationsEklsKind;
}): CommerceOperationsObservation[] {
  return observations.filter((observation) => {
    if (input.actorId && observation.actorId !== input.actorId) return false;
    if (input.workspaceId && observation.workspaceId !== input.workspaceId) return false;
    if (input.operationId && observation.operationId !== input.operationId) return false;
    if (input.kind && observation.kind !== input.kind) return false;
    return true;
  });
}

export function resetCommerceOperationsObservationStoreForTests(): void {
  observations.length = 0;
}
