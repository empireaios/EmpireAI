/** R3-07 — Cash flow record registry. */

import type { CashFlowRecord } from "./types.js";

export class CashFlowRegistry {
  private readonly records = new Map<string, CashFlowRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: CashFlowRecord, dedupeKey?: string): void {
    this.records.set(record.cashFlowRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): CashFlowRecord[] {
    return [...this.records.values()];
  }

  listValidated(): CashFlowRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
