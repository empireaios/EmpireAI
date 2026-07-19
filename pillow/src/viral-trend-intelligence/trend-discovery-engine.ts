/** R5-16 — Trend Discovery Engine. */

import { VTI_METADATA_VERSION } from "./paths.js";
import type { TrendCategory, TrendRecord, TrendSource } from "./types.js";

export class TrendDiscoveryEngine {
  private readonly records = new Map<string, TrendRecord>();

  discover(input: {
    trendCategory: TrendCategory;
    trendSource: TrendSource;
    keywordReference: string | null;
    hashtagReference: string | null;
    trendScore: number;
    growthRate: number;
    accelerationDetected: boolean;
    declineDetected: boolean;
    predictedScore: number;
    recommendationSummary: string;
  }): TrendRecord {
    const record: TrendRecord = {
      trendRecordId: `vti-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      trendCategory: input.trendCategory,
      trendSource: input.trendSource,
      keywordReference: input.keywordReference,
      hashtagReference: input.hashtagReference,
      trendScore: Math.round(input.trendScore * 100) / 100,
      growthRate: Math.round(input.growthRate * 100) / 100,
      accelerationDetected: input.accelerationDetected,
      declineDetected: input.declineDetected,
      predictedScore: Math.round(input.predictedScore * 100) / 100,
      recommendationSummary: input.recommendationSummary,
      authorizedPublicSignalsOnly: true,
      validationStatus: "passed",
      metadataVersion: VTI_METADATA_VERSION,
    };
    this.records.set(record.trendRecordId, record);
    return { ...record };
  }

  get(id: string): TrendRecord | null {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  persist(record: TrendRecord): void {
    this.records.set(record.trendRecordId, {
      ...record,
      timestamp: new Date().toISOString(),
    });
  }

  list(): TrendRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
