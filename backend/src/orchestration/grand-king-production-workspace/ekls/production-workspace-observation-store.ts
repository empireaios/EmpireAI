/**
 * G7-01 — Production workspace EKLS observation store.
 */

import type { ProductionWorkspaceEklsKind } from "../contracts/production-workspace-types.js";

export type ProductionWorkspaceEklsObservationRecord = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  kind: ProductionWorkspaceEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

let store: ProductionWorkspaceEklsObservationRecord[] = [];

export function resetProductionWorkspaceObservationStoreForTests(): void {
  store = [];
}

export function appendProductionWorkspaceObservation(
  record: ProductionWorkspaceEklsObservationRecord,
): void {
  store.push(record);
}

export function searchProductionWorkspaceObservations(input: {
  actorId?: string;
  workspaceId?: string;
  kind?: ProductionWorkspaceEklsKind;
  pillowGovernance: true;
}): ProductionWorkspaceEklsObservationRecord[] {
  return store.filter((record) => {
    if (input.actorId && record.actorId !== input.actorId) return false;
    if (input.workspaceId && record.workspaceId !== input.workspaceId) return false;
    if (input.kind && record.kind !== input.kind) return false;
    return true;
  });
}
