/** PILLOW-WOO-001 — WooCommerce Marketplace Integration types (R1-11). */

import type {
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  WOOCOMMERCE_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { WooCommerceMarketplaceIntegrationConfiguration } from "./configuration.js";

export type WooCommerceMarketplaceIntegrationEngineVersion = "PILLOW-WOO-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type WooCommerceCapability = (typeof WOOCOMMERCE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type WooCommerceConnectorRecord = {
  connectorId: string;
  storeId: string | null;
  storeUrl: string | null;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedWooCommerceCapabilities: WooCommerceCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type WooCommerceAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type WooCommerceConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type WooCommerceApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type WooCommerceApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type WooCommerceWebhookResult = {
  webhookId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type WooCommerceValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WooCommerceConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_webhook" | "register";
  record: WooCommerceConnectorRecord;
  validation: WooCommerceValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WooCommerceHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: WooCommerceValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type WooCommercePerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  connectionTests: number;
  apiRequests: number;
  webhooksProcessed: number;
  rateLimitedRequests: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WooCommerceLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type WooCommerceMarketplaceIntegrationState = {
  engineVersion: WooCommerceMarketplaceIntegrationEngineVersion;
  missionId: "R1-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: WooCommerceMarketplaceIntegrationConfiguration;
  latestReport: WooCommerceConnectorRunReport | null;
  connectorRecord: WooCommerceConnectorRecord | null;
  health: WooCommerceHealthReport;
  performance: WooCommercePerformanceStats;
};

export type WooCommerceCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  storeId: string | null;
  storeUrl: string | null;
  lastDecision: WooCommerceValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectWooCommerceInput = {
  credentialRef?: string;
  storeId?: string;
  storeUrl?: string;
  forceReconnect?: boolean;
};

export type RouteWooCommerceApiInput = {
  method: string;
  path: string;
};

export type HandleWooCommerceWebhookInput = {
  topic: string;
  payloadRef: string;
};
