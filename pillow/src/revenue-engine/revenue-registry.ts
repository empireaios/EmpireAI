/** R3-04 — Revenue record registry. */

import type { RevenueRecord } from "./types.js";

export class RevenueRegistry {
  private readonly records = new Map<string, RevenueRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: RevenueRecord, dedupeKey?: string): void {
    this.records.set(record.revenueRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  get(revenueRecordId: string): RevenueRecord | null {
    return this.records.get(revenueRecordId) ?? null;
  }

  list(): RevenueRecord[] {
    return [...this.records.values()];
  }

  listBySource(source: RevenueRecord["revenueSource"]): RevenueRecord[] {
    return this.list().filter((r) => r.revenueSource === source);
  }

  listValidated(): RevenueRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
