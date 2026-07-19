/** R3-15 — Financial risk record registry. */

import type { FinancialRiskRecord } from "./types.js";

export class RiskRegistry {
  private readonly records = new Map<string, FinancialRiskRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: FinancialRiskRecord, dedupeKey?: string): void {
    this.records.set(record.financialRiskId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: FinancialRiskRecord): void {
    this.records.set(record.financialRiskId, record);
  }

  get(financialRiskId: string): FinancialRiskRecord | null {
    return this.records.get(financialRiskId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): FinancialRiskRecord[] {
    return [...this.records.values()];
  }

  latest(): FinancialRiskRecord | null {
    const list = this.list();
    return list[list.length - 1] ?? null;
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
