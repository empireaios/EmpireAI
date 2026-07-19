/** R4-17 — Journey registry. */

import type { JourneyFailure, JourneyInsight, JourneyRecord } from "./types.js";

export class JourneyRegistry {
  private readonly records = new Map<string, JourneyRecord>();
  private readonly insights = new Map<string, JourneyInsight>();
  private readonly failures = new Map<string, JourneyFailure>();

  storeRecord(record: JourneyRecord): void {
    this.records.set(record.journeyRecordId, record);
  }

  storeInsight(insight: JourneyInsight): void {
    this.insights.set(insight.insightId, insight);
  }

  storeFailure(failure: JourneyFailure): void {
    this.failures.set(failure.failureId, failure);
  }

  getRecord(id: string): JourneyRecord | null {
    return this.records.get(id) ?? null;
  }

  listRecords(): JourneyRecord[] {
    return [...this.records.values()];
  }

  listRecordsForCustomer(customerId: string): JourneyRecord[] {
    return this.listRecords().filter((r) => r.customerId === customerId);
  }

  listInsights(): JourneyInsight[] {
    return [...this.insights.values()];
  }

  listFailures(): JourneyFailure[] {
    return [...this.failures.values()];
  }

  resetForTesting(): void {
    this.records.clear();
    this.insights.clear();
    this.failures.clear();
  }
}
