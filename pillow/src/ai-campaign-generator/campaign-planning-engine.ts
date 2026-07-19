/** R5-12 — Campaign Planning Engine. */

import { ACG_METADATA_VERSION } from "./paths.js";
import type {
  AiCampaignRecord,
  CampaignObjective,
  CampaignScheduleRecommendation,
  MarketingChannel,
} from "./types.js";

export class CampaignPlanningEngine {
  private readonly campaigns = new Map<string, AiCampaignRecord>();

  build(input: {
    objective: CampaignObjective;
    strategySummary: string;
    recommendedChannels: MarketingChannel[];
    recommendedAudience: string;
    recommendedBudget: number;
    recommendedSchedule: CampaignScheduleRecommendation;
    recommendedKeywords: string[];
    recommendedCreativeAssets: string[];
  }): AiCampaignRecord {
    const campaignSummary = [
      `AI campaign for ${input.objective}`,
      `channels=${input.recommendedChannels.join(",")}`,
      `budget=$${input.recommendedBudget}`,
      `audience=${input.recommendedAudience}`,
      `schedule=${input.recommendedSchedule.startDate}→${input.recommendedSchedule.endDate}`,
    ].join(" · ");

    const record: AiCampaignRecord = {
      aiCampaignId: `acg-camp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      campaignObjective: input.objective,
      strategySummary: input.strategySummary,
      recommendedChannels: [...input.recommendedChannels],
      recommendedAudience: input.recommendedAudience,
      recommendedBudget: input.recommendedBudget,
      recommendedSchedule: { ...input.recommendedSchedule },
      recommendedKeywords: [...input.recommendedKeywords],
      recommendedCreativeAssets: [...input.recommendedCreativeAssets],
      campaignSummary,
      publishReady: false,
      validationStatus: "passed",
      metadataVersion: ACG_METADATA_VERSION,
    };
    this.campaigns.set(record.aiCampaignId, record);
    return { ...record, recommendedChannels: [...record.recommendedChannels] };
  }

  get(id: string): AiCampaignRecord | null {
    const record = this.campaigns.get(id);
    return record
      ? {
          ...record,
          recommendedChannels: [...record.recommendedChannels],
          recommendedKeywords: [...record.recommendedKeywords],
          recommendedCreativeAssets: [...record.recommendedCreativeAssets],
          recommendedSchedule: { ...record.recommendedSchedule },
        }
      : null;
  }

  persist(record: AiCampaignRecord): void {
    this.campaigns.set(record.aiCampaignId, {
      ...record,
      recommendedChannels: [...record.recommendedChannels],
      recommendedKeywords: [...record.recommendedKeywords],
      recommendedCreativeAssets: [...record.recommendedCreativeAssets],
      recommendedSchedule: { ...record.recommendedSchedule },
      timestamp: new Date().toISOString(),
    });
  }

  list(): AiCampaignRecord[] {
    return [...this.campaigns.values()].map((r) => ({
      ...r,
      recommendedChannels: [...r.recommendedChannels],
      recommendedKeywords: [...r.recommendedKeywords],
      recommendedCreativeAssets: [...r.recommendedCreativeAssets],
      recommendedSchedule: { ...r.recommendedSchedule },
    }));
  }

  recommendChannels(input: {
    objective: CampaignObjective;
    preferred?: MarketingChannel[];
    available: MarketingChannel[];
  }): MarketingChannel[] {
    if (input.preferred && input.preferred.length > 0) {
      return input.preferred.filter((c) => input.available.includes(c));
    }
    const byObjective: Record<CampaignObjective, MarketingChannel[]> = {
      awareness: ["meta_ads", "youtube_ads", "seo"],
      traffic: ["google_ads", "seo", "meta_ads"],
      engagement: ["tiktok_ads", "meta_ads", "youtube_ads"],
      leads: ["google_ads", "meta_ads", "seo"],
      conversions: ["google_ads", "meta_ads", "youtube_ads"],
      retention: ["meta_ads", "google_ads", "seo"],
    };
    return byObjective[input.objective].filter((c) => input.available.includes(c));
  }

  resetForTesting(): void {
    this.campaigns.clear();
  }
}
