/** R4-15 — CLV registry. */

import type { ClvFailure, ClvInsight, ClvRecord } from "./types.js";

export class ClvRegistry {
  private readonly records = new Map<string, ClvRecord>();
  private readonly insights = new Map<string, ClvInsight>();
  private readonly failures = new Map<string, ClvFailure>();

  storeRecord(record: ClvRecord): void {
    this.records.set(record.clvRecordId, record);
  }

  storeInsight(insight: ClvInsight): void {
    this.insights.set(insight.insightId, insight);
  }

  storeFailure(failure: ClvFailure): void {
    this.failures.set(failure.failureId, failure);
  }

  getRecord(id: string): ClvRecord | null {
    return this.records.get(id) ?? null;
  }

  listRecords(): ClvRecord[] {
    return [...this.records.values()];
  }

  listRecordsForCustomer(customerId: string): ClvRecord[] {
    return this.listRecords().filter((r) => r.customerId === customerId);
  }

  listInsights(): ClvInsight[] {
    return [...this.insights.values()];
  }

  listFailures(): ClvFailure[] {
    return [...this.failures.values()];
  }

  resetForTesting(): void {
    this.records.clear();
    this.insights.clear();
    this.failures.clear();
  }
}
