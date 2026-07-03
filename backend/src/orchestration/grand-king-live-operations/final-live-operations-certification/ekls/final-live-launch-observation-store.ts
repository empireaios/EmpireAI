/**
 * G7-10 — Final live launch EKLS observation store.
 */

import type { FinalLiveLaunchEklsKind } from "../contracts/final-live-operations-certification-types.js";

export type FinalLiveLaunchObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  runId: string;
  kind: FinalLiveLaunchEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: FinalLiveLaunchObservation[] = [];

export function appendFinalLiveLaunchObservation(observation: FinalLiveLaunchObservation): void {
  observations.push(observation);
}

export function searchFinalLiveLaunchObservations(input: {
  actorId?: string;
  workspaceId?: string;
  runId?: string;
  kind?: FinalLiveLaunchEklsKind;
}): FinalLiveLaunchObservation[] {
  return observations.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.runId && obs.runId !== input.runId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetFinalLiveLaunchObservationStoreForTests(): void {
  observations.length = 0;
}
