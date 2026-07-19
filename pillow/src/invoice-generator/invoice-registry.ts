/** R3-09 — Invoice record registry. */

import type { InvoiceRecord } from "./types.js";

export class InvoiceRegistry {
  private readonly records = new Map<string, InvoiceRecord>();
  private readonly dedupeKeys = new Set<string>();
  private invoiceSequence = 0;

  store(record: InvoiceRecord, dedupeKey?: string): void {
    this.records.set(record.invoiceId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: InvoiceRecord): void {
    this.records.set(record.invoiceId, record);
  }

  get(invoiceId: string): InvoiceRecord | null {
    return this.records.get(invoiceId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  nextSequence(): number {
    this.invoiceSequence += 1;
    return this.invoiceSequence;
  }

  list(): InvoiceRecord[] {
    return [...this.records.values()];
  }

  listValidated(): InvoiceRecord[] {
    return this.list().filter((r) => r.validationStatus === "passed");
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
    this.invoiceSequence = 0;
  }
}
