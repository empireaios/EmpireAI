export {
  META_CAMPAIGN_STATUSES,
  META_BUDGET_TYPES,
  metaAudienceSchema,
  metaAdCreativeSchema,
  metaCampaignReportSchema,
  metaAdsCampaignRecordSchema,
  validateMetaAdsCampaignRecord,
} from "./models/meta-ads-campaign-record.js";
export type {
  MetaCampaignStatus,
  MetaBudgetType,
  MetaAudienceTargeting,
  MetaAdCreative,
  MetaCampaignReport,
  MetaAdsCampaignRecord,
  MetaAdsOAuthRecord,
} from "./models/meta-ads-campaign-record.js";

export {
  loadMetaAdsEnv,
  isMetaAdsLaunchAllowed,
  isMetaAdsLiveConfigured,
} from "./config/meta-ads-env.js";
export type { MetaAdsEnv } from "./config/meta-ads-env.js";

export type { MetaAdsRepository } from "./repositories/meta-ads-repository.js";
export {
  SqliteMetaAdsRepository,
  getMetaAdsRepository,
  resetMetaAdsRepository,
  createOAuthRecord,
  createCampaignRecord,
} from "./repositories/sqlite-meta-ads-repository.js";

export {
  MetaGraphApiClient,
  MetaGraphApiError,
  getMetaGraphApiClient,
  resetMetaGraphApiClient,
} from "./services/meta-graph-api-client.js";
export type {
  MetaTokenResponse,
  MetaLaunchResult,
  MetaCampaignInsights,
} from "./services/meta-graph-api-client.js";

export {
  MetaAdsBlockedError,
  getMetaAdsOAuthUrl,
  exchangeMetaAdsOAuthCode,
  prepareMetaCampaign,
  applyMetaCampaignApproval,
  uploadMetaCreative,
  launchMetaCampaign,
  syncMetaCampaignStatus,
  syncMetaCampaignReport,
  getMetaCampaignById,
  listMetaCampaigns,
  getMetaAdsOAuthStatus,
} from "./services/meta-ads-campaign-service.js";
export type {
  PrepareMetaCampaignInput,
  ApplyMetaCampaignApprovalInput,
  UploadMetaCreativeInput,
} from "./services/meta-ads-campaign-service.js";

export { registerMetaAdsConnectorRoutes } from "./routes/meta-ads-connector-routes.js";
export { metaAdsConnectorTools } from "./tools/meta-ads-connector-tools.js";

export {
  META_ADS_CONNECTOR_MODULE_ID,
  META_ADS_CONNECTOR_CAPABILITIES,
  createMetaAdsConnectorModuleContract,
} from "./contract/meta-ads-connector-module.js";
export type {
  MetaAdsConnectorCapability,
  MetaAdsConnectorModuleContract,
} from "./contract/meta-ads-connector-module.js";
