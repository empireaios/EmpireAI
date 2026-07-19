/** R3-10 — Refund record registry. */

import type { RefundRecord } from "./types.js";

export class RefundRegistry {
  private readonly records = new Map<string, RefundRecord>();
  private readonly dedupeKeys = new Set<string>();

  store(record: RefundRecord, dedupeKey?: string): void {
    this.records.set(record.refundId, record);
    if (dedupeKey) this.dedupeKeys.add(dedupeKey);
  }

  update(record: RefundRecord): void {
    this.records.set(record.refundId, record);
  }

  get(refundId: string): RefundRecord | null {
    return this.records.get(refundId) ?? null;
  }

  hasDedupeKey(key: string): boolean {
    return this.dedupeKeys.has(key);
  }

  list(): RefundRecord[] {
    return [...this.records.values()];
  }

  listByPayment(paymentReference: string): RefundRecord[] {
    return this.list().filter((r) => r.paymentReference === paymentReference);
  }

  completedRefundTotal(paymentReference: string): number {
    return this.listByPayment(paymentReference)
      .filter((r) => r.refundStatus === "completed")
      .reduce((s, r) => s + r.refundAmount, 0);
  }

  resetForTesting(): void {
    this.records.clear();
    this.dedupeKeys.clear();
  }
}
