/** R5-03 — Campaign Synchronization Engine. */

import { appendGaiLog } from "./gai-logging.js";
import { GAI_METADATA_VERSION } from "./paths.js";
import type {
  CampaignStatus,
  CreateGoogleAdvertisementInput,
  CreateAdGroupInput,
  GoogleAdsRecord,
  SynchronizationStatus,
} from "./types.js";

export class CampaignSynchronizationEngine {
  private records = new Map<string, GoogleAdsRecord>();

  createCampaign(input: {
    campaignName: string;
    customerAccountId: string;
    objective?: string;
  }): GoogleAdsRecord {
    const campaignReference = `gai-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: GoogleAdsRecord = {
      googleAdsRecordId: `gai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      customerAccountId: input.customerAccountId,
      campaignReference,
      adGroupReference: null,
      advertisementReference: null,
      campaignStatus: "draft",
      synchronizationStatus: "synced",
      validationStatus: "passed",
      metadataVersion: GAI_METADATA_VERSION,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    };
    this.records.set(campaignReference, record);
    appendGaiLog({
      event: "campaign_creation",
      level: "info",
      details: `Campaign created: ${campaignReference} (${input.campaignName})`,
    });
    return { ...record };
  }

  createAdGroup(input: CreateAdGroupInput): GoogleAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    const adGroupReference = `gai-adgroup-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.adGroupReference = adGroupReference;
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendGaiLog({
      event: "ad_group_creation",
      level: "info",
      details: `Ad group created: ${adGroupReference} for ${input.campaignReference}`,
    });
    return { ...campaign };
  }

  createAdvertisement(input: CreateGoogleAdvertisementInput): GoogleAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    if (campaign.adGroupReference !== input.adGroupReference) return null;
    const advertisementReference = `gai-ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.advertisementReference = advertisementReference;
    campaign.campaignStatus = "pending_review";
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendGaiLog({
      event: "advertisement_creation",
      level: "info",
      details: `Advertisement created: ${advertisementReference}`,
    });
    return { ...campaign };
  }

  syncStatus(campaignReference?: string): GoogleAdsRecord[] {
    const targets = campaignReference
      ? [this.records.get(campaignReference)].filter(Boolean)
      : [...this.records.values()];

    const synced: GoogleAdsRecord[] = [];
    for (const record of targets as GoogleAdsRecord[]) {
      const nextStatus = this.advanceStatus(record.campaignStatus);
      record.campaignStatus = nextStatus;
      record.synchronizationStatus = "synced" as SynchronizationStatus;
      record.timestamp = new Date().toISOString();
      this.records.set(record.campaignReference, record);
      synced.push({ ...record });
    }

    appendGaiLog({
      event: "campaign_synchronization",
      level: "info",
      details: `Synchronized ${synced.length} campaign(s)`,
    });
    return synced;
  }

  get(campaignReference: string): GoogleAdsRecord | null {
    const record = this.records.get(campaignReference);
    return record ? { ...record } : null;
  }

  list(): GoogleAdsRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  updatePerformance(
    campaignReference: string,
    metrics: { impressions: number; clicks: number; spend: number; conversions: number },
  ): GoogleAdsRecord | null {
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
