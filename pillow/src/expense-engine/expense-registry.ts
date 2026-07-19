/** R3-05 — Expense record registry. */

import type { ExpenseCategory, ExpenseRecord } from "./types.js";

export class ExpenseRegistry {
  private readonly records = new Map<string, ExpenseRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: ExpenseRecord, dedupeKey?: string): void {
    this.records.set(record.expenseRecordId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  get(expenseRecordId: string): ExpenseRecord | null {
    return this.records.get(expenseRecordId) ?? null;
  }

  list(): ExpenseRecord[] {
    return [...this.records.values()];
  }

  listValidated(): ExpenseRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  listByCategory(category: ExpenseCategory): ExpenseRecord[] {
    return this.list().filter((r) => r.expenseCategory === category);
  }

  listRecurring(): ExpenseRecord[] {
    return this.list().filter((r) => r.expenseCategory === "recurring");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
