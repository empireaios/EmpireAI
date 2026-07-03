/**
 * G2-03 — Pillow-governed supplier EKLS observation store (framework records only).
 */

import type { SupplierEklsObservationRecord } from "../contracts/supplier-integration-types.js";

const observationStore = new Map<string, SupplierEklsObservationRecord>();
const supplierIndex = new Map<string, Set<string>>();

export class SupplierObservationStore {
  save(record: SupplierEklsObservationRecord): SupplierEklsObservationRecord {
    observationStore.set(record.observationId, record);
    const supplierSet = supplierIndex.get(record.supplierId) ?? new Set<string>();
    supplierSet.add(record.observationId);
    supplierIndex.set(record.supplierId, supplierSet);
    return record;
  }

  getByObservationId(observationId: string): SupplierEklsObservationRecord | undefined {
    return observationStore.get(observationId);
  }

  list(workspaceId?: string, supplierId?: string): SupplierEklsObservationRecord[] {
    return [...observationStore.values()].filter((record) => {
      if (workspaceId && record.workspaceId !== workspaceId) return false;
      if (supplierId && record.supplierId !== supplierId) return false;
      return true;
    });
  }

  resetForTests(): void {
    observationStore.clear();
    supplierIndex.clear();
  }
}

let sharedStore: SupplierObservationStore | undefined;

export function getSupplierObservationStore(): SupplierObservationStore {
  if (!sharedStore) {
    sharedStore = new SupplierObservationStore();
  }
  return sharedStore;
}

export function resetSupplierObservationStoreForTests(): void {
  sharedStore = undefined;
  observationStore.clear();
  supplierIndex.clear();
}
