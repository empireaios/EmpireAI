/**
 * G2-07 — Pillow-governed analytics EKLS observation store (framework records only).
 */

import type { AnalyticsEklsObservationRecord } from "../contracts/analytics-integration-types.js";

const observationStore = new Map<string, AnalyticsEklsObservationRecord>();
const analyticsIndex = new Map<string, Set<string>>();

export class AnalyticsObservationStore {
  save(record: AnalyticsEklsObservationRecord): AnalyticsEklsObservationRecord {
    observationStore.set(record.observationId, record);
    const analyticsSet = analyticsIndex.get(record.analyticsId) ?? new Set<string>();
    analyticsSet.add(record.observationId);
    analyticsIndex.set(record.analyticsId, analyticsSet);
    return record;
  }

  getByObservationId(observationId: string): AnalyticsEklsObservationRecord | undefined {
    return observationStore.get(observationId);
  }

  list(workspaceId?: string, analyticsId?: string): AnalyticsEklsObservationRecord[] {
    return [...observationStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (analyticsId && record.analyticsId !== analyticsId) return false;
      return true;
    });
  }

  resetForTests(): void {
    observationStore.clear();
    analyticsIndex.clear();
  }
}

let sharedStore: AnalyticsObservationStore | undefined;

export function getAnalyticsObservationStore(): AnalyticsObservationStore {
  if (!sharedStore) {
    sharedStore = new AnalyticsObservationStore();
  }
  return sharedStore;
}

export function resetAnalyticsObservationStoreForTests(): void {
  sharedStore = undefined;
  observationStore.clear();
  analyticsIndex.clear();
}
