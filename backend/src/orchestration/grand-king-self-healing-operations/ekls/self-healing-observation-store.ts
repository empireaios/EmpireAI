/**
 * G7-08 — Self-healing EKLS observation store.
 */

import type { SelfHealingEklsKind } from "../contracts/self-healing-types.js";

export type SelfHealingObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  healingId: string;
  kind: SelfHealingEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const store: SelfHealingObservation[] = [];

export function appendSelfHealingObservation(observation: SelfHealingObservation): void {
  store.push(observation);
}

export function searchSelfHealingObservations(input: {
  actorId?: string;
  workspaceId?: string;
  healingId?: string;
  kind?: SelfHealingEklsKind;
}): SelfHealingObservation[] {
  return store.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.healingId && obs.healingId !== input.healingId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetSelfHealingObservationStoreForTests(): void {
  store.length = 0;
}
