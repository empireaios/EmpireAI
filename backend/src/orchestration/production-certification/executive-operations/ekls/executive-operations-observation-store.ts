/**
 * G6-07 — Executive operations EKLS observation store.
 */

import type { ExecutiveOperationsEklsKind } from "../contracts/executive-operations-types.js";

export type ExecutiveOperationsEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: ExecutiveOperationsEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, ExecutiveOperationsEklsObservationRecord[]>();

export function getExecutiveOperationsObservationStore(): {
  save(record: ExecutiveOperationsEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): ExecutiveOperationsEklsObservationRecord[];
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

export function resetExecutiveOperationsObservationStoreForTests(): void {
  store.clear();
}
