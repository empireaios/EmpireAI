/**
 * G7-07 — Autonomous operations EKLS observation store.
 */

import type { AutonomousEklsKind } from "../contracts/autonomous-operations-types.js";

export type AutonomousObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  autonomousOperationId: string;
  kind: AutonomousEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const store: AutonomousObservation[] = [];

export function appendAutonomousObservation(observation: AutonomousObservation): void {
  store.push(observation);
}

export function searchAutonomousObservations(input: {
  actorId?: string;
  workspaceId?: string;
  autonomousOperationId?: string;
  kind?: AutonomousEklsKind;
}): AutonomousObservation[] {
  return store.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.autonomousOperationId && obs.autonomousOperationId !== input.autonomousOperationId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetAutonomousObservationStoreForTests(): void {
  store.length = 0;
}
