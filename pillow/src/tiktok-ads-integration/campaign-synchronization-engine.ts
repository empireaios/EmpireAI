/** R5-04 — Campaign Synchronization Engine (includes audience sync). */

import { appendTaiLog } from "./tai-logging.js";
import { TAI_METADATA_VERSION } from "./paths.js";
import type {
  CampaignStatus,
  CreateTikTokAdvertisementInput,
  CreateAdGroupInput,
  TikTokAdsRecord,
  SynchronizationStatus,
} from "./types.js";

export class CampaignSynchronizationEngine {
  private records = new Map<string, TikTokAdsRecord>();

  createCampaign(input: {
    campaignName: string;
    advertiserAccountId: string;
    objective?: string;
  }): TikTokAdsRecord {
    const campaignReference = `tai-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: TikTokAdsRecord = {
      tiktokAdsRecordId: `tai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      advertiserAccountId: input.advertiserAccountId,
      campaignReference,
      adGroupReference: null,
      advertisementReference: null,
      audienceReference: null,
      campaignStatus: "draft",
      synchronizationStatus: "synced",
      validationStatus: "passed",
      metadataVersion: TAI_METADATA_VERSION,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    };
    this.records.set(campaignReference, record);
    appendTaiLog({
      event: "campaign_creation",
      level: "info",
      details: `Campaign created: ${campaignReference} (${input.campaignName})`,
    });
    return { ...record };
  }

  createAdGroup(input: CreateAdGroupInput): TikTokAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    const adGroupReference = `tai-adgroup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.adGroupReference = adGroupReference;
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendTaiLog({
      event: "ad_group_creation",
      level: "info",
      details: `Ad group created: ${adGroupReference} for ${input.campaignReference}`,
    });
    return { ...campaign };
  }

  createAdvertisement(input: CreateTikTokAdvertisementInput): TikTokAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    if (campaign.adGroupReference !== input.adGroupReference) return null;
    const advertisementReference = `tai-ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.advertisementReference = advertisementReference;
    campaign.campaignStatus = "pending_review";
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendTaiLog({
      event: "advertisement_creation",
      level: "info",
      details: `Advertisement created: ${advertisementReference}`,
    });
    return { ...campaign };
  }

  syncStatus(campaignReference?: string): TikTokAdsRecord[] {
    const targets = campaignReference
      ? [this.records.get(campaignReference)].filter(Boolean)
      : [...this.records.values()];

    const synced: TikTokAdsRecord[] = [];
    for (const record of targets as TikTokAdsRecord[]) {
      const nextStatus = this.advanceStatus(record.campaignStatus);
      record.campaignStatus = nextStatus;
      record.synchronizationStatus = "synced" as SynchronizationStatus;
      record.timestamp = new Date().toISOString();
      this.records.set(record.campaignReference, record);
      synced.push({ ...record });
    }

    appendTaiLog({
      event: "campaign_synchronization",
      level: "info",
      details: `Synchronized ${synced.length} campaign(s)`,
    });
    return synced;
  }

  syncAudience(input: {
    campaignReference?: string;
    audienceName?: string;
  }): TikTokAdsRecord[] {
    const targets = input.campaignReference
      ? [this.records.get(input.campaignReference)].filter(Boolean)
      : [...this.records.values()];

    const synced: TikTokAdsRecord[] = [];
    for (const record of targets as TikTokAdsRecord[]) {
      const audienceReference =
        record.audienceReference ??
        `tai-aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      record.audienceReference = audienceReference;
      record.synchronizationStatus = "synced";
      record.timestamp = new Date().toISOString();
      this.records.set(record.campaignReference, record);
      synced.push({ ...record });
    }

    appendTaiLog({
      event: "audience_synchronization",
      level: "info",
      details: `Synchronized audience for ${synced.length} campaign(s)${input.audienceName ? ` (${input.audienceName})` : ""}`,
    });
    return synced;
  }

  get(campaignReference: string): TikTokAdsRecord | null {
    const record = this.records.get(campaignReference);
    return record ? { ...record } : null;
  }

  list(): TikTokAdsRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  updatePerformance(
    campaignReference: string,
    metrics: { impressions: number; clicks: number; spend: number; conversions: number },
  ): TikTokAdsRecord | null {
    const record = this.records.get(campaignReference);
    if (!record) return null;
    record.impressions = metrics.impressions;
    record.clicks = metrics.clicks;
    record.spend = metrics.spend;
    record.conversions = metrics.conversions;
    record.timestamp = new Date().toISOString();
    this.records.set(campaignReference, record);
    return { ...record };
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
