/** PILLOW-SHF-001 — Shopify Store Marketplace Integration types (R1-10). */

import type {
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  SHOPIFY_STORE_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { ShopifyStoreMarketplaceIntegrationConfiguration } from "./configuration.js";

export type ShopifyStoreMarketplaceIntegrationEngineVersion = "PILLOW-SHF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type ShopifyStoreCapability = (typeof SHOPIFY_STORE_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ShopifyStoreConnectorRecord = {
  connectorId: string;
  storeId: string | null;
  storeDomain: string | null;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedShopifyStoreCapabilities: ShopifyStoreCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type ShopifyStoreAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type ShopifyStoreConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type ShopifyStoreApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type ShopifyStoreApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type ShopifyStoreWebhookResult = {
  webhookId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type ShopifyStoreValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ShopifyStoreConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_webhook" | "register";
  record: ShopifyStoreConnectorRecord;
  validation: ShopifyStoreValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ShopifyStoreHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: ShopifyStoreValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ShopifyStorePerformanceStats = {
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

export type ShopifyStoreLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type ShopifyStoreMarketplaceIntegrationState = {
  engineVersion: ShopifyStoreMarketplaceIntegrationEngineVersion;
  missionId: "R1-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: ShopifyStoreMarketplaceIntegrationConfiguration;
  latestReport: ShopifyStoreConnectorRunReport | null;
  connectorRecord: ShopifyStoreConnectorRecord | null;
  health: ShopifyStoreHealthReport;
  performance: ShopifyStorePerformanceStats;
};

export type ShopifyStoreCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  storeId: string | null;
  storeDomain: string | null;
  lastDecision: ShopifyStoreValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectShopifyStoreInput = {
  credentialRef?: string;
  storeId?: string;
  storeDomain?: string;
  forceReconnect?: boolean;
};

export type RouteShopifyStoreApiInput = {
  method: string;
  path: string;
};

export type HandleShopifyStoreWebhookInput = {
  topic: string;
  payloadRef: string;
};
