/**
 * G6-01 — Platform integrity EKLS observation store.
 */

import type { PlatformIntegrityEklsKind } from "../contracts/platform-integrity-types.js";

export type PlatformIntegrityEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: PlatformIntegrityEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, PlatformIntegrityEklsObservationRecord[]>();

export function getPlatformIntegrityObservationStore(): {
  save(record: PlatformIntegrityEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): PlatformIntegrityEklsObservationRecord[];
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

export function resetPlatformIntegrityObservationStoreForTests(): void {
  store.clear();
}
