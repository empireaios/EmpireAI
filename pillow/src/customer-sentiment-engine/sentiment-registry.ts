/** R4-10 — Sentiment registry. */

import type { SentimentAlert, SentimentRecord, SentimentTrend } from "./types.js";

export class SentimentRegistry {
  private readonly records = new Map<string, SentimentRecord>();
  private readonly alerts = new Map<string, SentimentAlert>();
  private readonly trends = new Map<string, SentimentTrend>();
  private readonly analyzeKeys = new Set<string>();

  storeRecord(record: SentimentRecord, analyzeKey?: string): void {
    this.records.set(record.sentimentRecordId, record);
    if (analyzeKey) this.analyzeKeys.add(analyzeKey);
  }

  storeAlert(alert: SentimentAlert): void {
    this.alerts.set(alert.alertId, alert);
  }

  storeTrend(trend: SentimentTrend): void {
    this.trends.set(trend.trendId, trend);
  }

  getRecord(sentimentRecordId: string): SentimentRecord | null {
    return this.records.get(sentimentRecordId) ?? null;
  }

  listRecords(): SentimentRecord[] {
    return [...this.records.values()];
  }

  listAlerts(): SentimentAlert[] {
    return [...this.alerts.values()];
  }

  listTrends(): SentimentTrend[] {
    return [...this.trends.values()];
  }

  hasAnalyzeKey(key: string): boolean {
    return this.analyzeKeys.has(key);
  }

  resetForTesting(): void {
    this.records.clear();
    this.alerts.clear();
    this.trends.clear();
    this.analyzeKeys.clear();
  }
}
