/**
 * G2-09 — Commerce plugin EKLS observation store.
 */

import type { CommercePluginEklsObservationRecord } from "../contracts/commerce-plugin-integration-types.js";

const observationStore = new Map<string, CommercePluginEklsObservationRecord[]>();

export function getCommercePluginObservationStore(): {
  save(record: CommercePluginEklsObservationRecord): void;
  list(workspaceId: string, pluginId?: string): CommercePluginEklsObservationRecord[];
} {
  return {
    save(record) {
      const key = record.workspaceId;
      const existing = observationStore.get(key) ?? [];
      existing.push(record);
      observationStore.set(key, existing);
    },
    list(workspaceId, pluginId) {
      const records = observationStore.get(workspaceId) ?? [];
      return pluginId ? records.filter((entry) => entry.pluginId === pluginId) : records;
    },
  };
}

export function resetCommercePluginObservationStoreForTests(): void {
  observationStore.clear();
}
