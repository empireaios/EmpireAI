/**
 * G6-09 — Production simulation EKLS observation store.
 */

import type { ProductionSimulationEklsKind } from "../contracts/production-simulation-types.js";

export type ProductionSimulationEklsObservationRecord = {
  observationId: string;
  runId: string;
  workspaceId: string;
  actorId: string;
  kind: ProductionSimulationEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, ProductionSimulationEklsObservationRecord[]>();

export function getProductionSimulationObservationStore(): {
  save(record: ProductionSimulationEklsObservationRecord): void;
  list(workspaceId: string, runId?: string): ProductionSimulationEklsObservationRecord[];
} {
  return {
    save(record) {
      const existing = store.get(record.workspaceId) ?? [];
      existing.push(record);
      store.set(record.workspaceId, existing);
    },
    list(workspaceId, runId) {
      const records = store.get(workspaceId) ?? [];
      return runId ? records.filter((entry) => entry.runId === runId) : records;
    },
  };
}

export function resetProductionSimulationObservationStoreForTests(): void {
  store.clear();
}
