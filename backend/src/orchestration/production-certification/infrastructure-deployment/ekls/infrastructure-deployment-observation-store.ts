/**
 * G6-03 — Infrastructure deployment EKLS observation store.
 */

import type { InfrastructureDeploymentEklsKind } from "../contracts/infrastructure-deployment-types.js";

export type InfrastructureDeploymentEklsObservationRecord = {
  observationId: string;
  scanId: string;
  workspaceId: string;
  actorId: string;
  kind: InfrastructureDeploymentEklsKind;
  summary: string;
  signalValue: number;
  recordedAt: string;
  pillowGoverned: true;
  eklsChannel: "production-certification";
};

const store = new Map<string, InfrastructureDeploymentEklsObservationRecord[]>();

export function getInfrastructureDeploymentObservationStore(): {
  save(record: InfrastructureDeploymentEklsObservationRecord): void;
  list(workspaceId: string, scanId?: string): InfrastructureDeploymentEklsObservationRecord[];
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

export function resetInfrastructureDeploymentObservationStoreForTests(): void {
  store.clear();
}
