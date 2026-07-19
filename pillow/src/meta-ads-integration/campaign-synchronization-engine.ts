/** R5-02 — Campaign Synchronization Engine. */

import { appendMaiLog } from "./mai-logging.js";
import { MAI_METADATA_VERSION } from "./paths.js";
import type {
  CampaignStatus,
  CreateAdvertisementInput,
  CreateAdSetInput,
  MetaAdsRecord,
  SynchronizationStatus,
} from "./types.js";

export class CampaignSynchronizationEngine {
  private records = new Map<string, MetaAdsRecord>();

  createCampaign(input: {
    campaignName: string;
    businessAccountId: string;
    adAccountId: string;
    objective?: string;
  }): MetaAdsRecord {
    const campaignReference = `mai-camp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const record: MetaAdsRecord = {
      metaRecordId: `mai-rec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      businessAccountId: input.businessAccountId,
      adAccountId: input.adAccountId,
      campaignReference,
      adSetReference: null,
      advertisementReference: null,
      campaignStatus: "draft",
      synchronizationStatus: "synced",
      validationStatus: "passed",
      metadataVersion: MAI_METADATA_VERSION,
      impressions: 0,
      clicks: 0,
      spend: 0,
      conversions: 0,
    };
    this.records.set(campaignReference, record);
    appendMaiLog({
      event: "campaign_creation",
      level: "info",
      details: `Campaign created: ${campaignReference} (${input.campaignName})`,
    });
    return { ...record };
  }

  createAdSet(input: CreateAdSetInput): MetaAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    const adSetReference = `mai-adset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.adSetReference = adSetReference;
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendMaiLog({
      event: "ad_set_creation",
      level: "info",
      details: `Ad set created: ${adSetReference} for ${input.campaignReference}`,
    });
    return { ...campaign };
  }

  createAdvertisement(input: CreateAdvertisementInput): MetaAdsRecord | null {
    const campaign = this.records.get(input.campaignReference);
    if (!campaign) return null;
    if (campaign.adSetReference !== input.adSetReference) return null;
    const advertisementReference = `mai-ad-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    campaign.advertisementReference = advertisementReference;
    campaign.campaignStatus = "pending_review";
    campaign.timestamp = new Date().toISOString();
    campaign.synchronizationStatus = "synced";
    this.records.set(input.campaignReference, campaign);
    appendMaiLog({
      event: "advertisement_creation",
      level: "info",
      details: `Advertisement created: ${advertisementReference}`,
    });
    return { ...campaign };
  }

  syncStatus(campaignReference?: string): MetaAdsRecord[] {
    const targets = campaignReference
      ? [this.records.get(campaignReference)].filter(Boolean)
      : [...this.records.values()];

    const synced: MetaAdsRecord[] = [];
    for (const record of targets as MetaAdsRecord[]) {
      const nextStatus = this.advanceStatus(record.campaignStatus);
      record.campaignStatus = nextStatus;
      record.synchronizationStatus = "synced" as SynchronizationStatus;
      record.timestamp = new Date().toISOString();
      this.records.set(record.campaignReference, record);
      synced.push({ ...record });
    }

    appendMaiLog({
      event: "campaign_synchronization",
      level: "info",
      details: `Synchronized ${synced.length} campaign(s)`,
    });
    return synced;
  }

  get(campaignReference: string): MetaAdsRecord | null {
    const record = this.records.get(campaignReference);
    return record ? { ...record } : null;
  }

  list(): MetaAdsRecord[] {
    return [...this.records.values()].map((r) => ({ ...r }));
  }

  updatePerformance(
    campaignReference: string,
    metrics: { impressions: number; clicks: number; spend: number; conversions: number },
  ): MetaAdsRecord | null {
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
