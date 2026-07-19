/** R3-14 — Budget record registry. */

import type { BudgetRecord } from "./types.js";

export class BudgetRegistry {
  private readonly records = new Map<string, BudgetRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: BudgetRecord, dedupeKey?: string): void {
    this.records.set(record.budgetRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: BudgetRecord): void {
    this.records.set(record.budgetRecordId, record);
  }

  get(budgetRecordId: string): BudgetRecord | null {
    return this.records.get(budgetRecordId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): BudgetRecord[] {
    return [...this.records.values()];
  }

  latest(): BudgetRecord | null {
    const list = this.list();
    return list[list.length - 1] ?? null;
  }

  findByPeriodAndCategory(period: string, category: string): BudgetRecord | null {
    return (
      this.list().find(
        (r) => r.budgetPeriod === period && r.budgetCategory === category,
      ) ?? null
    );
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
