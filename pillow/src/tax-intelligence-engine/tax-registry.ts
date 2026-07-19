/** R3-11 — Tax record registry. */

import type { TaxRecord } from "./types.js";

export class TaxRegistry {
  private readonly records = new Map<string, TaxRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: TaxRecord, dedupeKey?: string): void {
    this.records.set(record.taxRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: TaxRecord): void {
    this.records.set(record.taxRecordId, record);
  }

  get(taxRecordId: string): TaxRecord | null {
    return this.records.get(taxRecordId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): TaxRecord[] {
    return [...this.records.values()];
  }

  listByJurisdiction(jurisdiction: string): TaxRecord[] {
    return this.list().filter((r) => r.taxJurisdiction === jurisdiction);
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
