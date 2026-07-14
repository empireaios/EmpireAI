/** PILLOW-AMZ-001 — Amazon Marketplace Integration types (R1-02). */

import type {
  AMAZON_CAPABILITIES,
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AmazonMarketplaceIntegrationConfiguration } from "./configuration.js";

export type AmazonMarketplaceIntegrationEngineVersion = "PILLOW-AMZ-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type AmazonCapability = (typeof AMAZON_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AmazonConnectorRecord = {
  connectorId: string;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedAmazonCapabilities: AmazonCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type AmazonAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  region: string;
  details: string;
};

export type AmazonConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type AmazonApiRequest = {
  requestId: string;
  method: string;
  path: string;
  region: string;
  timestamp: string;
};

export type AmazonApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type AmazonEventResult = {
  eventId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type AmazonValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AmazonConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_event" | "register";
  record: AmazonConnectorRecord;
  validation: AmazonValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AmazonHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: AmazonValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type AmazonPerformanceStats = {
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

export type AmazonLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AmazonMarketplaceIntegrationState = {
  engineVersion: AmazonMarketplaceIntegrationEngineVersion;
  missionId: "R1-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: AmazonMarketplaceIntegrationConfiguration;
  latestReport: AmazonConnectorRunReport | null;
  connectorRecord: AmazonConnectorRecord | null;
  health: AmazonHealthReport;
  performance: AmazonPerformanceStats;
};

export type AmazonCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: AmazonValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectAmazonInput = {
  region?: "na" | "fe" | "eu";
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteAmazonApiInput = {
  method: string;
  path: string;
  region?: "na" | "fe" | "eu";
};

export type HandleAmazonEventInput = {
  topic: string;
  payloadRef: string;
};
