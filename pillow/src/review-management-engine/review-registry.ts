/** R4-11 — Review registry. */

import type { ReputationAlert, ReviewRecord, ReviewTrend } from "./types.js";

export class ReviewRegistry {
  private readonly records = new Map<string, ReviewRecord>();
  private readonly alerts = new Map<string, ReputationAlert>();
  private readonly trends = new Map<string, ReviewTrend>();
  private readonly importKeys = new Set<string>();

  storeRecord(record: ReviewRecord, importKey?: string): void {
    this.records.set(record.reviewRecordId, record);
    if (importKey) this.importKeys.add(importKey);
  }

  storeAlert(alert: ReputationAlert): void {
    this.alerts.set(alert.alertId, alert);
  }

  storeTrend(trend: ReviewTrend): void {
    this.trends.set(trend.trendId, trend);
  }

  getRecord(reviewRecordId: string): ReviewRecord | null {
    return this.records.get(reviewRecordId) ?? null;
  }

  listRecords(): ReviewRecord[] {
    return [...this.records.values()];
  }

  listAlerts(): ReputationAlert[] {
    return [...this.alerts.values()];
  }

  listTrends(): ReviewTrend[] {
    return [...this.trends.values()];
  }

  hasImportKey(key: string): boolean {
    return this.importKeys.has(key);
  }

  resetForTesting(): void {
    this.records.clear();
    this.alerts.clear();
    this.trends.clear();
    this.importKeys.clear();
  }
}
