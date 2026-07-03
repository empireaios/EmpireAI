/**
 * G7-04 — Executive decision EKLS observation store.
 */

import type { ExecutiveDecisionEklsKind } from "../contracts/executive-decision-types.js";

export type ExecutiveDecisionObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  decisionId: string;
  kind: ExecutiveDecisionEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: ExecutiveDecisionObservation[] = [];

export function appendExecutiveDecisionObservation(observation: ExecutiveDecisionObservation): void {
  observations.push(observation);
}

export function searchExecutiveDecisionObservations(input: {
  actorId?: string;
  workspaceId?: string;
  decisionId?: string;
  kind?: ExecutiveDecisionEklsKind;
}): ExecutiveDecisionObservation[] {
  return observations.filter((observation) => {
    if (input.actorId && observation.actorId !== input.actorId) return false;
    if (input.workspaceId && observation.workspaceId !== input.workspaceId) return false;
    if (input.decisionId && observation.decisionId !== input.decisionId) return false;
    if (input.kind && observation.kind !== input.kind) return false;
    return true;
  });
}

export function resetExecutiveDecisionObservationStoreForTests(): void {
  observations.length = 0;
}
