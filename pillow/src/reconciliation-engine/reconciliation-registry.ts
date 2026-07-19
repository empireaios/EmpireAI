/** R3-08 — Reconciliation record registry. */

import type { ReconciliationRecord } from "./types.js";

export class ReconciliationRegistry {
  private readonly records = new Map<string, ReconciliationRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: ReconciliationRecord, dedupeKey?: string): void {
    this.records.set(record.reconciliationRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): ReconciliationRecord[] {
    return [...this.records.values()];
  }

  listValidated(): ReconciliationRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
