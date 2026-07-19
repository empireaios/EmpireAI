/** R5-14 — Conversion Tracking Engine. */

import { CVI_METADATA_VERSION } from "./paths.js";
import type { ConversionRecord, FunnelStage, MarketingChannel } from "./types.js";

export class ConversionTrackingEngine {
  private readonly records = new Map<string, ConversionRecord>();

  track(input: {
    campaignReference: string | null;
    marketingChannel: MarketingChannel;
    funnelStage: FunnelStage;
    conversionRate: number;
    dropOffRate: number;
    conversionEfficiencyScore: number;
    landingPageScore: number;
    bottleneckDetected: boolean;
    abandonmentDetected: boolean;
    recommendedOptimization: string;
  }): ConversionRecord {
    const record: ConversionRecord = {
      conversionRecordId: `cvi-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      campaignReference: input.campaignReference,
      marketingChannel: input.marketingChannel,
      funnelStage: input.funnelStage,
      conversionRate: Math.round(input.conversionRate * 100) / 100,
      dropOffRate: Math.round(input.dropOffRate * 100) / 100,
      conversionEfficiencyScore: input.conversionEfficiencyScore,
      landingPageScore: Math.round(input.landingPageScore * 100) / 100,
      bottleneckDetected: input.bottleneckDetected,
      abandonmentDetected: input.abandonmentDetected,
      recommendedOptimization: input.recommendedOptimization,
      appliedToProductionCampaign: false,
      validationStatus: "passed",
      metadataVersion: CVI_METADATA_VERSION,
    };
    this.records.set(record.conversionRecordId, record);
    return { ...record };
  }

  get(id: string): ConversionRecord | null {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  persist(record: ConversionRecord): void {
    this.records.set(record.conversionRecordId, {
      ...record,
      timestamp: new Date().toISOString(),
    });
  }

  list(): ConversionRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
