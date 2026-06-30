export {
  ANALYTICS_PLATFORMS,
  CONVERSION_EVENT_NAMES,
  pixelConfigSchema,
  serverSideEventRecordSchema,
  conversionRecordSchema,
  roasSnapshotSchema,
  validateConversionRecord,
  validateRoasSnapshot,
} from "./models/analytics-conversion-record.js";
export type {
  AnalyticsPlatform,
  ConversionEventName,
  PixelConfig,
  ServerSideEventRecord,
  ConversionRecord,
  RoasSnapshot,
} from "./models/analytics-conversion-record.js";

export {
  loadAnalyticsConversionEnv,
  isServerSideLiveConfigured,
} from "./config/analytics-conversion-env.js";
export type { AnalyticsConversionEnv } from "./config/analytics-conversion-env.js";

export type { AnalyticsConversionRepository } from "./repositories/analytics-conversion-repository.js";
export {
  SqliteAnalyticsConversionRepository,
  getAnalyticsConversionRepository,
  createPixelConfigRecord,
  createConversionRecord,
  createServerEventRecord,
  createRoasSnapshotRecord,
} from "./repositories/sqlite-analytics-conversion-repository.js";

export {
  sendGa4ServerEvent,
  sendMetaServerEvent,
  sendTikTokServerEvent,
} from "./services/platform-dispatch-service.js";
export type { ServerEventPayload } from "./services/platform-dispatch-service.js";

export { dispatchServerSideEvent } from "./services/server-side-event-service.js";
export type { DispatchResult } from "./services/server-side-event-service.js";

export { buildConversionPixelScripts } from "./services/pixel-script-builder.js";
export type { PixelScriptInput } from "./services/pixel-script-builder.js";

export {
  registerPixelConfig,
  trackServerSideEvent,
  trackPurchaseConversion,
  trackPurchaseFromPayment,
  recordAdSpend,
  computeRoasSnapshot,
  getPixelConfig,
  listConversions,
  listServerEvents,
  getLatestRoasSnapshot,
  AnalyticsConversionBlockedError,
} from "./services/analytics-conversion-service.js";
export type {
  RegisterPixelConfigInput,
  TrackServerEventInput,
  TrackPurchaseInput,
  RecordAdSpendInput,
} from "./services/analytics-conversion-service.js";

export { registerAnalyticsConversionRoutes } from "./routes/analytics-conversion-routes.js";
export { analyticsConversionTools } from "./tools/analytics-conversion-tools.js";

export {
  ANALYTICS_CONVERSION_ENGINE_MODULE_ID,
  ANALYTICS_CONVERSION_ENGINE_VERSION,
  ANALYTICS_CONVERSION_ENGINE_CAPABILITIES,
  AnalyticsConversionEngineModule,
  createAnalyticsConversionEngineModule,
  analyticsConversionEngineModule,
} from "./contract/analytics-conversion-engine-module.js";
export type {
  AnalyticsConversionEngineModuleId,
  AnalyticsConversionCapability,
} from "./contract/analytics-conversion-engine-module.js";
