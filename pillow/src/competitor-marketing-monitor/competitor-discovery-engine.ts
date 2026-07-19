/** R5-15 — Competitor Discovery Engine. */

import { CMM_METADATA_VERSION } from "./paths.js";
import type { CompetitorRecord, MarketingChannel } from "./types.js";

export class CompetitorDiscoveryEngine {
  private readonly records = new Map<string, CompetitorRecord>();

  discover(input: {
    competitorIdentifier: string;
    marketingChannel: MarketingChannel;
    campaignReference: string | null;
    keywordReference: string | null;
    promotionSummary: string;
    competitiveScore: number;
    recommendationSummary: string;
    strategyChangeDetected: boolean;
    emergingCompetitor: boolean;
  }): CompetitorRecord {
    const record: CompetitorRecord = {
      competitorRecordId: `cmm-rec-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      competitorIdentifier: input.competitorIdentifier,
      marketingChannel: input.marketingChannel,
      campaignReference: input.campaignReference,
      keywordReference: input.keywordReference,
      promotionSummary: input.promotionSummary,
      competitiveScore: Math.round(input.competitiveScore * 100) / 100,
      recommendationSummary: input.recommendationSummary,
      strategyChangeDetected: input.strategyChangeDetected,
      emergingCompetitor: input.emergingCompetitor,
      authorizedPublicSignalsOnly: true,
      validationStatus: "passed",
      metadataVersion: CMM_METADATA_VERSION,
    };
    this.records.set(record.competitorRecordId, record);
    return { ...record };
  }

  get(id: string): CompetitorRecord | null {
    const record = this.records.get(id);
    return record ? { ...record } : null;
  }

  persist(record: CompetitorRecord): void {
    this.records.set(record.competitorRecordId, {
      ...record,
      timestamp: new Date().toISOString(),
    });
  }

  list(): CompetitorRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  resetForTesting(): void {
    this.records.clear();
  }
}
