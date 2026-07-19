/** R4-13 — Return intelligence registry. */

import type {
  ReturnInsight,
  ReturnIntelligenceFailure,
  ReturnIntelligenceRecord,
} from "./types.js";

export class ReturnIntelligenceRegistry {
  private readonly records = new Map<string, ReturnIntelligenceRecord>();
  private readonly insights = new Map<string, ReturnInsight>();
  private readonly failures = new Map<string, ReturnIntelligenceFailure>();
  private readonly processedRequestKeys = new Set<string>();

  storeRecord(record: ReturnIntelligenceRecord, requestKey?: string): void {
    this.records.set(record.returnIntelligenceId, record);
    if (requestKey) this.processedRequestKeys.add(requestKey);
  }

  storeInsight(insight: ReturnInsight): void {
    this.insights.set(insight.insightId, insight);
  }

  storeFailure(failure: ReturnIntelligenceFailure): void {
    this.failures.set(failure.failureId, failure);
  }

  getRecord(id: string): ReturnIntelligenceRecord | null {
    return this.records.get(id) ?? null;
  }

  listRecords(): ReturnIntelligenceRecord[] {
    return [...this.records.values()];
  }

  listInsights(): ReturnInsight[] {
    return [...this.insights.values()];
  }

  listFailures(): ReturnIntelligenceFailure[] {
    return [...this.failures.values()];
  }

  hasRequestKey(key: string): boolean {
    return this.processedRequestKeys.has(key);
  }

  resetForTesting(): void {
    this.records.clear();
    this.insights.clear();
    this.failures.clear();
    this.processedRequestKeys.clear();
  }
}
