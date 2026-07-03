/**
 * G2-04 — Pillow-governed storefront EKLS outcome store (framework records only).
 */

import type { StorefrontEklsOutcomeRecord } from "../contracts/storefront-integration-types.js";

const outcomeStore = new Map<string, StorefrontEklsOutcomeRecord>();
const storefrontIndex = new Map<string, Set<string>>();

export class StorefrontOutcomeStore {
  save(record: StorefrontEklsOutcomeRecord): StorefrontEklsOutcomeRecord {
    outcomeStore.set(record.outcomeId, record);
    const storefrontSet = storefrontIndex.get(record.storefrontId) ?? new Set<string>();
    storefrontSet.add(record.outcomeId);
    storefrontIndex.set(record.storefrontId, storefrontSet);
    return record;
  }

  getByOutcomeId(outcomeId: string): StorefrontEklsOutcomeRecord | undefined {
    return outcomeStore.get(outcomeId);
  }

  list(workspaceId?: string, storefrontId?: string): StorefrontEklsOutcomeRecord[] {
    return [...outcomeStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (storefrontId && record.storefrontId !== storefrontId) return false;
      return true;
    });
  }

  resetForTests(): void {
    outcomeStore.clear();
    storefrontIndex.clear();
  }
}

let sharedStore: StorefrontOutcomeStore | undefined;

export function getStorefrontOutcomeStore(): StorefrontOutcomeStore {
  if (!sharedStore) {
    sharedStore = new StorefrontOutcomeStore();
  }
  return sharedStore;
}

export function resetStorefrontOutcomeStoreForTests(): void {
  sharedStore = undefined;
  outcomeStore.clear();
  storefrontIndex.clear();
}
