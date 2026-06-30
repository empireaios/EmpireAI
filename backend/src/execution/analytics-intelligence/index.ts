export {
  GA4_EVENT_TYPES,
  googleAnalyticsModelSchema,
  validateGoogleAnalyticsModel,
} from "./models/google-analytics-model.js";
export type { Ga4EventType, GoogleAnalyticsModel } from "./models/google-analytics-model.js";

export {
  META_PIXEL_EVENTS,
  metaPixelModelSchema,
  validateMetaPixelModel,
} from "./models/meta-pixel-model.js";
export type { MetaPixelEvent, MetaPixelModel } from "./models/meta-pixel-model.js";

export {
  TIKTOK_PIXEL_EVENTS,
  tikTokPixelModelSchema,
  validateTikTokPixelModel,
} from "./models/tiktok-pixel-model.js";
export type { TikTokPixelEvent, TikTokPixelModel } from "./models/tiktok-pixel-model.js";

export {
  serverSideEventSchema,
  conversionEventSchema,
  validateServerSideEvent,
  validateConversionEvent,
} from "./models/analytics-events.js";
export type { ServerSideEvent, ConversionEvent } from "./models/analytics-events.js";

export {
  analyticsFunnelSchema,
  revenueAttributionModelSchema,
  validateAnalyticsFunnel,
  validateRevenueAttributionModel,
} from "./models/analytics-funnel.js";
export type {
  FunnelStage,
  AnalyticsFunnel,
  RevenueAttributionModel,
} from "./models/analytics-funnel.js";

export {
  DASHBOARD_METRIC_CATEGORIES,
  dashboardMetricSchema,
  validateDashboardMetric,
} from "./models/dashboard-metric.js";
export type { DashboardMetricCategory, DashboardMetric } from "./models/dashboard-metric.js";

export {
  ANALYTICS_SIGNAL_TYPES,
  analyticsSignalSchema,
  validateAnalyticsSignal,
} from "./models/analytics-signal.js";
export type { AnalyticsSignalType, AnalyticsSignal } from "./models/analytics-signal.js";

export {
  analyticsBlueprintSchema,
  validateAnalyticsBlueprint,
} from "./models/analytics-blueprint.js";
export type {
  AnalyticsBlueprintId,
  AnalyticsBlueprint,
  AnalyticsBlueprintCreateInput,
} from "./models/analytics-blueprint.js";

export {
  analyticsIntelligenceRecordSchema,
  validateAnalyticsIntelligenceRecord,
} from "./models/analytics-intelligence-record.js";
export type {
  AnalyticsIntelligenceRecordId,
  AnalyticsIntelligenceRecord,
  AnalyticsIntelligenceRecordCreateInput,
} from "./models/analytics-intelligence-record.js";

export type {
  AnalyticsIntelligenceRepositoryQuery,
  AnalyticsIntelligenceRepository,
} from "./repositories/analytics-intelligence-repository.js";

export {
  InMemoryAnalyticsIntelligenceRepository,
  createInMemoryAnalyticsIntelligenceRepository,
} from "./repositories/in-memory-analytics-intelligence-repository.js";

export {
  ANALYTICS_SIGNAL_WEIGHTS,
  generateAnalyticsBlueprint,
  analyticsIntelligenceScoring,
} from "./scoring/analytics-intelligence-scoring.js";
export type {
  AnalyticsIntelligenceBrandInput,
  AnalyticsIntelligenceOfferInput,
  AnalyticsIntelligenceInput,
  AnalyticsIntelligenceBreakdown,
} from "./scoring/analytics-intelligence-scoring.js";

export {
  AnalyticsIntelligenceEngine,
  defaultAnalyticsIntelligenceEngine,
} from "./engines/analytics-intelligence-engine.js";

export {
  ANALYTICS_INTELLIGENCE_MODULE_ID,
  ANALYTICS_INTELLIGENCE_MODULE_VERSION,
  ANALYTICS_INTELLIGENCE_CAPABILITIES,
  ANALYTICS_INTELLIGENCE_MODULE_CONTRACT,
  AnalyticsIntelligenceModule,
  createAnalyticsIntelligenceModule,
  analyticsIntelligenceModule,
} from "./contract/analytics-intelligence-module.js";
export type {
  AnalyticsIntelligenceModuleId,
  AnalyticsIntelligenceCapability,
  AnalyticsIntelligenceModuleContract,
} from "./contract/analytics-intelligence-module.js";
