export {
  LIVE_STORE_STATUSES,
  liveStoreConfigSchema,
  liveStoreAnalyticsSchema,
  validateLiveStoreConfig,
} from "./models/live-store-config.js";
export type { LiveStoreStatus, LiveStoreConfig, LiveStoreAnalytics } from "./models/live-store-config.js";

export {
  REVENUE_ORDER_STATUSES,
  revenueOrderRecordSchema,
  validateRevenueOrderRecord,
} from "./models/revenue-order-record.js";
export type { RevenueOrderStatus, RevenueOrderRecord } from "./models/revenue-order-record.js";

export {
  loadRevenueLoopEnv,
  isStripeConfigured,
} from "./config/revenue-loop-env.js";
export type { RevenueLoopEnv } from "./config/revenue-loop-env.js";

export type { RevenueLoopRepository, LiveStoreRecord } from "./repositories/revenue-loop-repository.js";
export {
  SqliteRevenueLoopRepository,
  getRevenueLoopRepository,
  createLiveStoreRecord,
} from "./repositories/sqlite-revenue-loop-repository.js";

export { buildAnalyticsScripts, buildStorefrontHtml } from "./services/analytics-injection.js";
export { deployLiveStore, readDeployedStorefront } from "./services/storefront-deploy-service.js";
export type { DeployLiveStoreInput, DeployLiveStoreResult } from "./services/storefront-deploy-service.js";

export {
  createCheckoutSession,
  verifyStripeWebhookSignature,
  buildMockCheckoutCompletedEvent,
} from "./services/stripe-client.js";
export type { StripeCheckoutSession, StripeWebhookEvent } from "./services/stripe-client.js";

export {
  ingestCheckoutCompleted,
  applyFulfillmentApproval,
  submitLiveFulfillment,
  LiveFulfillmentBlockedError,
} from "./services/revenue-loop-service.js";

export { registerRevenueLoopRoutes } from "./routes/revenue-loop-routes.js";
export { revenueLoopTools } from "./tools/revenue-loop-tools.js";

export const MINIMUM_LIVE_REVENUE_LOOP_MODULE_ID = "minimum-live-revenue-loop" as const;
export const MINIMUM_LIVE_REVENUE_LOOP_VERSION = "0.1.0" as const;
