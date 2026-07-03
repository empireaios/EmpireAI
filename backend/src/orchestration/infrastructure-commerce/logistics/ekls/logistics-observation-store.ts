/**
 * G2-06 — Pillow-governed logistics EKLS observation store (framework records only).
 */

import type { LogisticsEklsObservationRecord } from "../contracts/logistics-integration-types.js";

const observationStore = new Map<string, LogisticsEklsObservationRecord>();
const providerIndex = new Map<string, Set<string>>();

export class LogisticsObservationStore {
  save(record: LogisticsEklsObservationRecord): LogisticsEklsObservationRecord {
    observationStore.set(record.observationId, record);
    const providerSet = providerIndex.get(record.providerId) ?? new Set<string>();
    providerSet.add(record.observationId);
    providerIndex.set(record.providerId, providerSet);
    return record;
  }

  getByObservationId(observationId: string): LogisticsEklsObservationRecord | undefined {
    return observationStore.get(observationId);
  }

  list(workspaceId?: string, providerId?: string): LogisticsEklsObservationRecord[] {
    return [...observationStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (providerId && record.providerId !== providerId) return false;
      return true;
    });
  }

  resetForTests(): void {
    observationStore.clear();
    providerIndex.clear();
  }
}

let sharedStore: LogisticsObservationStore | undefined;

export function getLogisticsObservationStore(): LogisticsObservationStore {
  if (!sharedStore) {
    sharedStore = new LogisticsObservationStore();
  }
  return sharedStore;
}

export function resetLogisticsObservationStoreForTests(): void {
  sharedStore = undefined;
  observationStore.clear();
  providerIndex.clear();
}
