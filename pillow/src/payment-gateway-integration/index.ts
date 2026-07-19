/** PILLOW-PG-001 — Payment Gateway Integration exports (R3-02). */

export {
  PaymentGatewayIntegrationEngine,
  createPaymentGatewayIntegrationEngine,
  resetPaymentGatewayIntegrationForTesting,
} from "./engine.js";

export {
  buildPaymentGatewayIntegrationConfiguration,
  DEFAULT_PAYMENT_GATEWAY_INTEGRATION_CONFIGURATION,
  type PaymentGatewayIntegrationConfiguration,
} from "./configuration.js";

export {
  PAYMENT_GATEWAY_INTEGRATION_SYSTEM_PATH,
  PG_METADATA_VERSION,
  PAYMENT_GATEWAY_ID,
  PG_CAPABILITIES,
  ENGINE_STATUSES,
  GATEWAY_STATES,
} from "./paths.js";

export type {
  PaymentGatewayIntegrationEngineVersion,
  GatewayRecord,
  PaymentRecord,
  PaymentGatewayRunReport,
  PaymentGatewayIntegrationState,
  PaymentCockpitSnapshot,
  PaymentHealthReport,
  PaymentPerformanceStats,
  ConnectPaymentGatewayInput,
  RegisterGatewayInput,
  CreatePaymentRequestInput,
  ProcessPaymentInput,
  HandlePaymentWebhookInput,
  SyncPaymentStatusInput,
  PgCapability,
  EngineStatus,
  GatewayState,
  AuthenticationStatus,
  ConnectionStatus,
  PaymentStatus,
  AuthorizationStatus,
  HealthStatus,
  ValidationStatus,
} from "./types.js";
