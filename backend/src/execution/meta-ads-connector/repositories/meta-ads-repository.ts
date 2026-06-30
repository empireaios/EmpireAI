import type { MetaAdsCampaignRecord, MetaAdsOAuthRecord } from "../models/meta-ads-campaign-record.js";

export interface MetaAdsRepository {
  saveOAuth(record: MetaAdsOAuthRecord): MetaAdsOAuthRecord;
  getOAuth(workspaceId: string, companyId?: string): MetaAdsOAuthRecord | null;

  saveCampaign(record: MetaAdsCampaignRecord): MetaAdsCampaignRecord;
  getCampaignById(campaignId: string): MetaAdsCampaignRecord | null;
  listCampaigns(workspaceId: string, companyId?: string): MetaAdsCampaignRecord[];
}
