/**
 * G6-06 — Performance EKLS observation store.
 */

import type { PerformanceEklsKind } from "../contracts/performance-certification-types.js";

export type PerformanceEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: PerformanceEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, PerformanceEklsObservationRecord[]>();

export function getPerformanceObservationStore(): {
  save(record: PerformanceEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): PerformanceEklsObservationRecord[];
} {
  return {
    save(record) {
      const existing = store.get(record.workspaceId) ?? [];
      existing.push(record);
      store.set(record.workspaceId, existing);
    },
    list(workspaceId, scanId) {
      const records = store.get(workspaceId) ?? [];
      return scanId ? records.filter((entry) => entry.scanId === scanId) : records;
    },
  };
}

export function resetPerformanceObservationStoreForTests(): void {
  store.clear();
}
