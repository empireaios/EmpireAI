/**
 * G2-05 — Pillow-governed payment EKLS outcome store (credential-free framework records).
 */

import type { PaymentEklsOutcomeRecord } from "../contracts/payment-integration-types.js";

const outcomeStore = new Map<string, PaymentEklsOutcomeRecord>();
const providerIndex = new Map<string, Set<string>>();

export class PaymentOutcomeStore {
  save(record: PaymentEklsOutcomeRecord): PaymentEklsOutcomeRecord {
    outcomeStore.set(record.outcomeId, record);
    const providerSet = providerIndex.get(record.providerId) ?? new Set<string>();
    providerSet.add(record.outcomeId);
    providerIndex.set(record.providerId, providerSet);
    return record;
  }

  getByOutcomeId(outcomeId: string): PaymentEklsOutcomeRecord | undefined {
    return outcomeStore.get(outcomeId);
  }

  list(workspaceId?: string, providerId?: string): PaymentEklsOutcomeRecord[] {
    return [...outcomeStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (providerId && record.providerId !== providerId) return false;
      return true;
    });
  }

  resetForTests(): void {
    outcomeStore.clear();
    providerIndex.clear();
  }
}

let sharedStore: PaymentOutcomeStore | undefined;

export function getPaymentOutcomeStore(): PaymentOutcomeStore {
  if (!sharedStore) {
    sharedStore = new PaymentOutcomeStore();
  }
  return sharedStore;
}

export function resetPaymentOutcomeStoreForTests(): void {
  sharedStore = undefined;
  outcomeStore.clear();
  providerIndex.clear();
}
