/**
 * G2-08 — Commerce orchestration EKLS observation store.
 */

import type { CommerceOrchestrationEklsObservationRecord } from "../contracts/commerce-orchestration-types.js";

const observationStore = new Map<string, CommerceOrchestrationEklsObservationRecord>();

export class CommerceOrchestrationObservationStore {
  save(record: CommerceOrchestrationEklsObservationRecord): CommerceOrchestrationEklsObservationRecord {
    observationStore.set(record.observationId, record);
    return record;
  }

  list(workspaceId?: string, profileId?: string): CommerceOrchestrationEklsObservationRecord[] {
    return [...observationStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (profileId && record.profileId !== profileId) return false;
      return true;
    });
  }

  resetForTests(): void {
    observationStore.clear();
  }
}

let sharedStore: CommerceOrchestrationObservationStore | undefined;

export function getCommerceOrchestrationObservationStore(): CommerceOrchestrationObservationStore {
  if (!sharedStore) sharedStore = new CommerceOrchestrationObservationStore();
  return sharedStore;
}

export function resetCommerceOrchestrationObservationStoreForTests(): void {
  sharedStore = undefined;
  observationStore.clear();
}
