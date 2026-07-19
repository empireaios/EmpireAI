/** R2-18 — SLA History Engine. */

import type { SlaHistoryEntry, SlaRecord } from "./types.js";

export class SlaHistoryEngine {
  private history: SlaHistoryEntry[] = [];

  recordHistory(record: SlaRecord): SlaHistoryEntry {
    const entry: SlaHistoryEntry = {
      historyId: `fsm-hist-${Date.now()}-${record.orderReference}`,
      slaRecordId: record.slaRecordId,
      orderReference: record.orderReference,
      complianceStatus: record.complianceStatus,
      complianceScore: record.complianceScore,
      recordedAt: new Date().toISOString(),
    };
    this.history.push(entry);
    if (this.history.length > 1000) this.history.splice(0, this.history.length - 1000);
    return entry;
  }

  getHistory(limit = 50): SlaHistoryEntry[] {
    return this.history.slice(-limit);
  }

  getHistoryForOrder(orderReference: string): SlaHistoryEntry[] {
    return this.history.filter((h) => h.orderReference === orderReference);
  }

  resetForTesting(): void {
    this.history = [];
  }
}
