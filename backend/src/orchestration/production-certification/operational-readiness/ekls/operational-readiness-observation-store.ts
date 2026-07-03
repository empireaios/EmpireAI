/**
 * G6-04 — Operational readiness EKLS observation store.
 */

import type { OperationalReadinessEklsKind } from "../contracts/operational-readiness-types.js";

export type OperationalReadinessEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: OperationalReadinessEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, OperationalReadinessEklsObservationRecord[]>();

export function getOperationalReadinessObservationStore(): {
  save(record: OperationalReadinessEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): OperationalReadinessEklsObservationRecord[];
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

export function resetOperationalReadinessObservationStoreForTests(): void {
  store.clear();
}
