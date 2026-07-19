/** R2-10 — Fulfilment Status Tracker. */

import type { FulfilmentRecord } from "./types.js";

export class FulfilmentStatusTracker {
  private records: FulfilmentRecord[] = [];

  track(record: FulfilmentRecord): void {
    const idx = this.records.findIndex((r) => r.fulfilmentId === record.fulfilmentId);
    if (idx >= 0) {
      this.records[idx] = record;
    } else {
      this.records.push(record);
    }
  }

  getByOrderReference(orderReference: string): FulfilmentRecord | undefined {
    return this.records.find((r) => r.orderReference === orderReference);
  }

  getByProcurementReference(procurementReference: string): FulfilmentRecord | undefined {
    return this.records.find((r) => r.procurementReference === procurementReference);
  }

  getAll(): FulfilmentRecord[] {
    return [...this.records];
  }

  resetForTesting(): void {
    this.records = [];
  }
}
