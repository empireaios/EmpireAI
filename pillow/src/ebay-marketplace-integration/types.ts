/** PILLOW-EBAY-001 — eBay Marketplace Integration types (R1-08). */

import type {
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  EBAY_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { EbayMarketplaceIntegrationConfiguration } from "./configuration.js";

export type EbayMarketplaceIntegrationEngineVersion = "PILLOW-EBAY-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type EbayCapability = (typeof EBAY_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type EbayConnectorRecord = {
  connectorId: string;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedEbayCapabilities: EbayCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type EbayAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type EbayConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type EbayApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type EbayApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type EbayEventResult = {
  eventId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type EbayValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EbayConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_event" | "register";
  record: EbayConnectorRecord;
  validation: EbayValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EbayHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: EbayValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type EbayPerformanceStats = {
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

export type EbayLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type EbayMarketplaceIntegrationState = {
  engineVersion: EbayMarketplaceIntegrationEngineVersion;
  missionId: "R1-08";
  status: EngineStatus;
  initializedAt: string;
  configuration: EbayMarketplaceIntegrationConfiguration;
  latestReport: EbayConnectorRunReport | null;
  connectorRecord: EbayConnectorRecord | null;
  health: EbayHealthReport;
  performance: EbayPerformanceStats;
};

export type EbayCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: EbayValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectEbayInput = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteEbayApiInput = {
  method: string;
  path: string;
};

export type HandleEbayEventInput = {
  topic: string;
  payloadRef: string;
};
