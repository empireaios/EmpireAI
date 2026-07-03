/**
 * G6-00 — Certification EKLS observation store.
 */

import type { CertificationEklsObservationKind } from "../contracts/production-certification-types.js";

export type CertificationEklsObservationRecord = {
  observationId: string;
  runId: string;
  workspaceId: string;
  actorId: string;
  kind: CertificationEklsObservationKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, CertificationEklsObservationRecord[]>();

export function getCertificationObservationStore(): {
  save(record: CertificationEklsObservationRecord): void;
  list(workspaceId: string, runId?: string): CertificationEklsObservationRecord[];
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

export function resetCertificationObservationStoreForTests(): void {
  store.clear();
}
