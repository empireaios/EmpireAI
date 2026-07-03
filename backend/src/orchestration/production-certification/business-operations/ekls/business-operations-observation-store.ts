/**
 * G6-05 — Business operations EKLS observation store.
 */

import type { BusinessOperationsEklsKind } from "../contracts/business-operations-types.js";

export type BusinessOperationsEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: BusinessOperationsEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, BusinessOperationsEklsObservationRecord[]>();

export function getBusinessOperationsObservationStore(): {
  save(record: BusinessOperationsEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): BusinessOperationsEklsObservationRecord[];
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

export function resetBusinessOperationsObservationStoreForTests(): void {
  store.clear();
}
