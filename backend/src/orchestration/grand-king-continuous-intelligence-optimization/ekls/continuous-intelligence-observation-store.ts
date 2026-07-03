/**
 * G7-06 — Continuous intelligence EKLS observation store.
 */

import type { OptimizationEklsKind } from "../contracts/continuous-intelligence-types.js";

export type OptimizationObservation = {
  observationId: string;
  actorId: string;
  workspaceId: string;
  optimizationId: string;
  kind: OptimizationEklsKind;
  summary: string;
  recordedAt: string;
  pillowGoverned: true;
};

const store: OptimizationObservation[] = [];

export function appendOptimizationObservation(observation: OptimizationObservation): void {
  store.push(observation);
}

export function searchOptimizationObservations(input: {
  actorId?: string;
  workspaceId?: string;
  optimizationId?: string;
  kind?: OptimizationEklsKind;
}): OptimizationObservation[] {
  return store.filter((obs) => {
    if (input.actorId && obs.actorId !== input.actorId) return false;
    if (input.workspaceId && obs.workspaceId !== input.workspaceId) return false;
    if (input.optimizationId && obs.optimizationId !== input.optimizationId) return false;
    if (input.kind && obs.kind !== input.kind) return false;
    return true;
  });
}

export function resetOptimizationObservationStoreForTests(): void {
  store.length = 0;
}
