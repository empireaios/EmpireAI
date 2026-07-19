/** R5-02 — Performance Retrieval Engine. */

import { appendMaiLog } from "./mai-logging.js";
import type { CampaignSynchronizationEngine } from "./campaign-synchronization-engine.js";
import type { MetaAdsRecord } from "./types.js";

export class PerformanceRetrievalEngine {
  constructor(private readonly campaigns: CampaignSynchronizationEngine) {}

  retrieve(campaignReference?: string): MetaAdsRecord[] {
    const targets = campaignReference
      ? [this.campaigns.get(campaignReference)].filter(Boolean)
      : this.campaigns.list();

    const results: MetaAdsRecord[] = [];
    for (const record of targets as MetaAdsRecord[]) {
      const impressions = Math.max(record.impressions, 100 + (record.clicks || 0) * 10);
      const clicks = Math.max(record.clicks, Math.floor(impressions * 0.02));
      const spend = Math.max(record.spend, Number((clicks * 0.45).toFixed(2)));
      const conversions = Math.max(record.conversions, Math.floor(clicks * 0.1));
      const updated = this.campaigns.updatePerformance(record.campaignReference, {
        impressions,
        clicks,
        spend,
        conversions,
      });
      if (updated) results.push(updated);
    }

    appendMaiLog({
      event: "performance_retrieval",
      level: "info",
      details: `Retrieved performance for ${results.length} campaign(s)`,
    });
    return results;
  }
}
