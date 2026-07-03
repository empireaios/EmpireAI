/**
 * G6-02 — Security governance EKLS observation store.
 */

import type { SecurityGovernanceEklsKind } from "../contracts/security-governance-types.js";

export type SecurityGovernanceEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: SecurityGovernanceEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, SecurityGovernanceEklsObservationRecord[]>();

export function getSecurityGovernanceObservationStore(): {
  save(record: SecurityGovernanceEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): SecurityGovernanceEklsObservationRecord[];
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

export function resetSecurityGovernanceObservationStoreForTests(): void {
  store.clear();
}
