/** R5-05 — Video Campaign Manager. */

import { appendYaiLog } from "./yai-logging.js";
import { YAI_METADATA_VERSION } from "./paths.js";
import type {
  CampaignStatus,
  CreateAdGroupInput,
  CreateVideoAdvertisementInput,
  YouTubeAdsRecord,
  SynchronizationStatus,
} from "./types.js";

export class VideoCampaignManager {
  private records = new Map<string, YouTubeAdsRecord>();

  createCampaign(input: {
    campaignName: string;
    advertiserAccountId: string;
    objective?: string;
  }): YouTubeAdsRecord {
    const campaignReference = `yai-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: YouTubeAdsRecord = {
      youtubeAdsRecordId: `yai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      advertiserAccountId: input.advertiserAccountId,
      campaignReference,
      adGroupReference: null,
      videoAssetReference: null,
      advertisementReference: null,
      campaignStatus: "draft",
      synchronizationStatus: "synced",
      validationStatus: "passed",
      metadataVersion: YAI_METADATA_VERSION,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
      views: 0,
    };
    this.records.set(campaignReference, record);
    appendYaiLog({
      event: "campaign_creation",
      level: "info",
      details: `YouTube campaign created: ${campaignReference} (${input.campaignName})`,
    });
    return { ...record };
  }

  createAdGroup(input: CreateAdGroupInput): YouTubeAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    const adGroupReference = `yai-adgroup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.adGroupReference = adGroupReference;
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendYaiLog({
      event: "ad_group_creation",
      level: "info",
      details: `Ad group created: ${adGroupReference} for ${input.campaignReference}`,
    });
    return { ...campaign };
  }

  createVideoAdvertisement(input: CreateVideoAdvertisementInput): YouTubeAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    if (campaign.adGroupReference !== input.adGroupReference) return null;
    const advertisementReference = `yai-ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.advertisementReference = advertisementReference;
    campaign.videoAssetReference = input.videoAssetReference;
    campaign.campaignStatus = "pending_review";
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendYaiLog({
      event: "video_advertisement_creation",
      level: "info",
      details: `Video advertisement created: ${advertisementReference}`,
    });
    return { ...campaign };
  }

  attachVideoAsset(campaignReference: string, videoAssetReference: string): YouTubeAdsRecord | null {
    const campaign = this.records.get(campaignReference);
    if (!campaign) return null;
    campaign.videoAssetReference = videoAssetReference;
    campaign.timestamp = new Date().toISOString();
    this.records.set(campaignReference, campaign);
    return { ...campaign };
  }

  get(campaignReference: string): YouTubeAdsRecord | null {
    const record = this.records.get(campaignReference);
    return record ? { ...record } : null;
  }

  list(): YouTubeAdsRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  updatePerformance(
    campaignReference: string,
    metrics: {
      impressions: number;
      clicks: number;
      spend: number;
      conversions: number;
      views: number;
    },
  ): YouTubeAdsRecord | null {
    const record = this.records.get(campaignReference);
    if (!record) return null;
    record.impressions = metrics.impressions;
    record.clicks = metrics.clicks;
    record.spend = metrics.spend;
    record.conversions = metrics.conversions;
    record.views = metrics.views;
    record.timestamp = new Date().toISOString();
    this.records.set(campaignReference, record);
    return { ...record };
  }

  syncStatus(campaignReference?: string): YouTubeAdsRecord[] {
    const targets = campaignReference
      ? [this.records.get(campaignReference)].filter(Boolean)
      : [...this.records.values()];

    const synced: YouTubeAdsRecord[] = [];
    for (const record of targets as YouTubeAdsRecord[]) {
      record.campaignStatus = this.advanceStatus(record.campaignStatus);
      record.synchronizationStatus = "synced" as SynchronizationStatus;
      record.timestamp = new Date().toISOString();
      this.records.set(record.campaignReference, record);
      synced.push({ ...record });
    }
    return synced;
  }

  resetForTesting(): void {
    this.records.clear();
  }

  private advanceStatus(status: CampaignStatus): CampaignStatus {
    if (status === "draft") return "pending_review";
    if (status === "pending_review") return "active";
    if (status === "active") return "active";
    return status;
  }
}
