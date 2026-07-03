/**
 * G7-05 — Financial operations EKLS observation store.
 */

import type { FinancialEklsKind } from "../contracts/financial-operations-types.js";

export type FinancialObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  financialRecordId: string;
  kind: FinancialEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const store: FinancialObservation[] = [];

export function appendFinancialObservation(observation: FinancialObservation): void {
  store.push(observation);
}

export function searchFinancialObservations(input: {
  actorId?: string;
  workspaceId?: string;
  financialRecordId?: string;
  kind?: FinancialEklsKind;
}): FinancialObservation[] {
  return store.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.financialRecordId && obs.financialRecordId !== input.financialRecordId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetFinancialObservationStoreForTests(): void {
  store.length = 0;
}
