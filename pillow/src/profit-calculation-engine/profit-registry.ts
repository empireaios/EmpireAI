/** R3-06 — Profit record registry. */

import type { ProfitRecord } from "./types.js";

export class ProfitRegistry {
  private readonly records = new Map<string, ProfitRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: ProfitRecord, dedupeKey?: string): void {
    this.records.set(record.profitRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): ProfitRecord[] {
    return [...this.records.values()];
  }

  listValidated(): ProfitRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
