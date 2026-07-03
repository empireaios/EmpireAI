/**
 * G7-09 — Operational intelligence EKLS observation store.
 */

import type { OperationalIntelligenceEklsKind } from "../contracts/operational-intelligence-types.js";

export type OperationalIntelligenceObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  insightId: string;
  kind: OperationalIntelligenceEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: OperationalIntelligenceObservation[] = [];

export function appendOperationalIntelligenceObservation(observation: OperationalIntelligenceObservation): void {
  observations.push(observation);
}

export function searchOperationalIntelligenceObservations(input: {
  actorId?: string;
  workspaceId?: string;
  insightId?: string;
  kind?: OperationalIntelligenceEklsKind;
}): OperationalIntelligenceObservation[] {
  return observations.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.insightId && obs.insightId !== input.insightId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetOperationalIntelligenceObservationStoreForTests(): void {
  observations.length = 0;
}
