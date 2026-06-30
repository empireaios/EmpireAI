import type { MetaAdsCampaignRecord, MetaAdsOAuthRecord } from "../models/meta-ads-campaign-record.js";
import type { MetaAdsRepository } from "../repositories/meta-ads-repository.js";
import { getMetaAdsRepository } from "../repositories/sqlite-meta-ads-repository.js";

export const META_ADS_CONNECTOR_MODULE_ID = "meta-ads-connector" as const;

export type MetaAdsConnectorCapability =
  | "meta-ads-connector.oauth"
  | "meta-ads-connector.prepare"
  | "meta-ads-connector.approve"
  | "meta-ads-connector.launch"
  | "meta-ads-connector.report";

export const META_ADS_CONNECTOR_CAPABILITIES: MetaAdsConnectorCapability[] = [
  "meta-ads-connector.oauth",
  "meta-ads-connector.prepare",
  "meta-ads-connector.approve",
  "meta-ads-connector.launch",
  "meta-ads-connector.report",
];

export type MetaAdsConnectorModuleContract = {
  moduleId: typeof META_ADS_CONNECTOR_MODULE_ID;
  capabilities: MetaAdsConnectorCapability[];
  repository: MetaAdsRepository;
  getCampaign(campaignId: string): MetaAdsCampaignRecord | null;
  getOAuth(workspaceId: string, companyId?: string): MetaAdsOAuthRecord | null;
};

export function createMetaAdsConnectorModuleContract(): MetaAdsConnectorModuleContract {
  const repository = getMetaAdsRepository();
  return {
    moduleId: META_ADS_CONNECTOR_MODULE_ID,
    capabilities: META_ADS_CONNECTOR_CAPABILITIES,
    repository,
    getCampaign: (campaignId) => repository.getCampaignById(campaignId),
    getOAuth: (workspaceId, companyId) => repository.getOAuth(workspaceId, companyId),
  };
}
