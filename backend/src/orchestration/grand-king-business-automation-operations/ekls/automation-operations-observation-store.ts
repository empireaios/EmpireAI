/**
 * G7-03 — Automation operations EKLS observation store.
 */

import type { AutomationOperationsEklsKind } from "../contracts/automation-operations-types.js";

export type AutomationOperationsObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  automationOperationId: string;
  kind: AutomationOperationsEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const observations: AutomationOperationsObservation[] = [];

export function appendAutomationOperationsObservation(observation: AutomationOperationsObservation): void {
  observations.push(observation);
}

export function searchAutomationOperationsObservations(input: {
  actorId?: string;
  workspaceId?: string;
  automationOperationId?: string;
  kind?: AutomationOperationsEklsKind;
}): AutomationOperationsObservation[] {
  return observations.filter((observation) => {
    if (input.actorId && observation.actorId !== input.actorId) return false;
    if (input.workspaceId && observation.workspaceId !== input.workspaceId) return false;
    if (input.automationOperationId && observation.automationOperationId !== input.automationOperationId) {
      return false;
    }
    if (input.kind && observation.kind !== input.kind) return false;
    return true;
  });
}

export function resetAutomationOperationsObservationStoreForTests(): void {
  observations.length = 0;
}
