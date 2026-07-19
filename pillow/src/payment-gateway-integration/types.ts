/** PILLOW-PG-001 — Payment Gateway Integration types (R3-02). */

import type {
  AUTHENTICATION_STATUSES,
  AUTHORIZATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  GATEWAY_STATES,
  HEALTH_STATUSES,
  PAYMENT_STATUSES,
  PG_CAPABILITIES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PaymentGatewayIntegrationConfiguration } from "./configuration.js";

export type PaymentGatewayIntegrationEngineVersion = "PILLOW-PG-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type GatewayState = (typeof GATEWAY_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUSES)[number];
export type PgCapability = (typeof PG_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type GatewayRecord = {
  gatewayRecordId: string;
  timestamp: string;
  gatewayId: string;
  gatewayVersion: string;
  providerIdentifier: string;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: PgCapability[];
  currentOperationalState: GatewayState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkModuleId: string | null;
};

export type PaymentRecord = {
  paymentId: string;
  timestamp: string;
  gatewayId: string;
  transactionId: string;
  customerReference: string;
  orderReference: string;
  paymentAmount: number;
  currency: string;
  paymentStatus: PaymentStatus;
  authorizationStatus: AuthorizationStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type PaymentAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type PaymentConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type PaymentWebhookResult = {
  eventId: string;
  accepted: boolean;
  verified: boolean;
  normalized: boolean;
  paymentId: string | null;
  details: string;
};

export type PaymentValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PaymentGatewayRunReport = {
  gatewayRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_gateway"
    | "create_payment"
    | "authorize"
    | "capture"
    | "cancel"
    | "handle_webhook"
    | "sync_status";
  gatewayRecord: GatewayRecord;
  paymentRecords: PaymentRecord[];
  validation: PaymentValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PaymentHealthReport = {
  status: HealthStatus;
  healthScore: number;
  gatewayEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: PaymentValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPayments: number;
  notes: string[];
};

export type PaymentPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  paymentRequests: number;
  authorizations: number;
  captures: number;
  cancellations: number;
  webhookEventsHandled: number;
  statusSyncs: number;
  rateLimitedOperations: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type PaymentLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type PaymentGatewayIntegrationState = {
  engineVersion: PaymentGatewayIntegrationEngineVersion;
  missionId: "R3-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: PaymentGatewayIntegrationConfiguration;
  latestReport: PaymentGatewayRunReport | null;
  gatewayRecord: GatewayRecord | null;
  health: PaymentHealthReport;
  performance: PaymentPerformanceStats;
};

export type PaymentCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: GatewayState | null;
  lastDecision: PaymentValidationReport["decision"] | null;
  paymentRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectPaymentGatewayInput = {
  credentialRef?: string;
  providerIdentifier?: string;
  forceReconnect?: boolean;
};

export type RegisterGatewayInput = {
  providerIdentifier: string;
  gatewayVersion?: string;
};

export type CreatePaymentRequestInput = {
  customerReference: string;
  orderReference: string;
  paymentAmount: number;
  currency?: string;
};

export type ProcessPaymentInput = {
  paymentId: string;
};

export type HandlePaymentWebhookInput = {
  topic: string;
  payloadRef: string;
  transactionId?: string;
};

export type SyncPaymentStatusInput = {
  paymentId?: string;
  transactionId?: string;
};
