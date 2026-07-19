/** R5-15 — Campaign Monitoring Engine. */

import type { CompetitorRecord } from "./types.js";

export class CampaignMonitoringEngine {
  monitorCampaigns(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      campaignReference: record.campaignReference ?? `cmp-${record.competitorIdentifier}`,
      promotionSummary: record.promotionSummary || `Public campaign signal for ${record.competitorIdentifier}`,
      timestamp: new Date().toISOString(),
    }));
  }

  monitorAdvertisements(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      promotionSummary: `Public ad creative signal on ${record.marketingChannel}`,
      competitiveScore: Math.min(100, record.competitiveScore + 1),
      timestamp: new Date().toISOString(),
    }));
  }

  monitorPromotions(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      promotionSummary: `Public promotion watch: ${record.competitorIdentifier}`,
      timestamp: new Date().toISOString(),
    }));
  }

  monitorLandingPages(records: CompetitorRecord[]): CompetitorRecord[] {
    return records.map((record) => ({
      ...record,
      promotionSummary: `Public landing page signal for ${record.competitorIdentifier}`,
      competitiveScore: Math.min(100, record.competitiveScore + 0.5),
      timestamp: new Date().toISOString(),
    }));
  }
}
