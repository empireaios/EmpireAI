export {
  PAYMENT_PROVIDERS,
  PAYMENT_METHODS,
  PAYMENT_STATUSES,
  livePaymentRecordSchema,
  validateLivePaymentRecord,
} from "./models/live-payment-record.js";
export type {
  PaymentProvider,
  PaymentMethod,
  PaymentStatus,
  LivePaymentRecord,
  RevenueSummary,
} from "./models/live-payment-record.js";

export {
  PAYPAL_ARCHITECTURE_BLUEPRINT,
  paypalArchitectureSchema,
  validatePayPalArchitectureBlueprint,
} from "./models/paypal-architecture.js";
export type { PayPalArchitectureBlueprint } from "./models/paypal-architecture.js";

export {
  loadLivePaymentEnv,
  isStripeLiveConfigured,
} from "./config/live-payment-env.js";
export type { LivePaymentEnv } from "./config/live-payment-env.js";

export type { LivePaymentRepository } from "./repositories/live-payment-repository.js";
export {
  SqliteLivePaymentRepository,
  getLivePaymentRepository,
  createLivePaymentRecord,
} from "./repositories/sqlite-live-payment-repository.js";

export {
  createStripeCheckoutSession,
  createStripePaymentIntent,
  verifyStripeWebhookSignature,
  buildMockCheckoutCompletedEvent,
  buildMockPaymentIntentSucceededEvent,
  estimateStripeFeeCents,
} from "./services/stripe-payment-service.js";
export type {
  StripeWebhookEvent,
  StripeCheckoutResult,
  StripePaymentIntentResult,
} from "./services/stripe-payment-service.js";

export {
  recordSaleInLedger,
  recordRefundInLedger,
  computeRevenueFromPayments,
  getLedgerRevenue,
} from "./services/ledger-integration-service.js";
export type { LedgerPaymentResult } from "./services/ledger-integration-service.js";

export {
  createLiveCheckout,
  createLivePaymentIntent,
  processStripeWebhookEvent,
  completeMockCheckout,
  completeMockPaymentIntent,
  getPaymentById,
  listLivePayments,
  getRevenueSummary,
  LivePaymentEngineBlockedError,
} from "./services/live-payment-engine-service.js";
export type {
  CreateLiveCheckoutInput,
  CreateLivePaymentIntentInput,
} from "./services/live-payment-engine-service.js";

export { registerLivePaymentRoutes } from "./routes/live-payment-routes.js";
export { livePaymentTools } from "./tools/live-payment-tools.js";

export {
  LIVE_PAYMENT_ENGINE_MODULE_ID,
  LIVE_PAYMENT_ENGINE_VERSION,
  LIVE_PAYMENT_ENGINE_CAPABILITIES,
  LivePaymentEngineModule,
  createLivePaymentEngineModule,
  livePaymentEngineModule,
} from "./contract/live-payment-engine-module.js";
export type {
  LivePaymentEngineModuleId,
  LivePaymentEngineCapability,
} from "./contract/live-payment-engine-module.js";

export const MINIMUM_LIVE_PAYMENT_ENGINE_MODULE_ID = "live-payment-engine" as const;
