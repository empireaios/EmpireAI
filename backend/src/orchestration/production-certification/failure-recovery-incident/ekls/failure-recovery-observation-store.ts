/**
 * G6-08 — Failure recovery EKLS observation store.
 */

import type { FailureRecoveryEklsKind } from "../contracts/failure-recovery-incident-types.js";

export type FailureRecoveryEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: FailureRecoveryEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, FailureRecoveryEklsObservationRecord[]>();

export function getFailureRecoveryObservationStore(): {
  save(record: FailureRecoveryEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): FailureRecoveryEklsObservationRecord[];
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

export function resetFailureRecoveryObservationStoreForTests(): void {
  store.clear();
}
