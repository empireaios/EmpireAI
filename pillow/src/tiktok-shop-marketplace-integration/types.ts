/** PILLOW-TTS-001 — TikTok Shop Marketplace Integration types (R1-09). */

import type {
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  TIKTOK_SHOP_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { TikTokShopMarketplaceIntegrationConfiguration } from "./configuration.js";

export type TikTokShopMarketplaceIntegrationEngineVersion = "PILLOW-TTS-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type TikTokShopCapability = (typeof TIKTOK_SHOP_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type TikTokShopConnectorRecord = {
  connectorId: string;
  shopId: string | null;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedTikTokShopCapabilities: TikTokShopCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type TikTokShopAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type TikTokShopConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type TikTokShopApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type TikTokShopApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type TikTokShopEventResult = {
  eventId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type TikTokShopValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type TikTokShopConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_event" | "register";
  record: TikTokShopConnectorRecord;
  validation: TikTokShopValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type TikTokShopHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: TikTokShopValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type TikTokShopPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  connectionTests: number;
  apiRequests: number;
  eventsProcessed: number;
  rateLimitedRequests: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type TikTokShopLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type TikTokShopMarketplaceIntegrationState = {
  engineVersion: TikTokShopMarketplaceIntegrationEngineVersion;
  missionId: "R1-09";
  status: EngineStatus;
  initializedAt: string;
  configuration: TikTokShopMarketplaceIntegrationConfiguration;
  latestReport: TikTokShopConnectorRunReport | null;
  connectorRecord: TikTokShopConnectorRecord | null;
  health: TikTokShopHealthReport;
  performance: TikTokShopPerformanceStats;
};

export type TikTokShopCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  shopId: string | null;
  lastDecision: TikTokShopValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectTikTokShopInput = {
  credentialRef?: string;
  shopId?: string;
  forceReconnect?: boolean;
};

export type RouteTikTokShopApiInput = {
  method: string;
  path: string;
};

export type HandleTikTokShopEventInput = {
  topic: string;
  payloadRef: string;
};
