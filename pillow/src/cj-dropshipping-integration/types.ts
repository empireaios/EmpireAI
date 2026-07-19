/** PILLOW-CJ-001 — CJdropshipping Integration types (R2-02). */

import type {
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
  CJ_CAPABILITIES,
  AUTHENTICATION_STATUSES,
} from "./paths.js";
import type { CjDropshippingIntegrationConfiguration } from "./configuration.js";

export type CjDropshippingIntegrationEngineVersion = "PILLOW-CJ-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type CjCapability = (typeof CJ_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type CjConnectorRecord = {
  connectorId: string;
  timestamp: string;
  supplierId: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: CjCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkSupplierId: string | null;
};

export type CjAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type CjConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type CjApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type CjApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type CjWebhookResult = {
  eventId: string;
  accepted: boolean;
  verified: boolean;
  normalized: boolean;
  details: string;
};

export type CjValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CjConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_webhook" | "register";
  record: CjConnectorRecord;
  validation: CjValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CjHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: CjValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type CjPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  connectionTests: number;
  apiRequests: number;
  webhookEventsHandled: number;
  rateLimitedRequests: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CjLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CjDropshippingIntegrationState = {
  engineVersion: CjDropshippingIntegrationEngineVersion;
  missionId: "R2-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: CjDropshippingIntegrationConfiguration;
  latestReport: CjConnectorRunReport | null;
  connectorRecord: CjConnectorRecord | null;
  health: CjHealthReport;
  performance: CjPerformanceStats;
};

export type CjCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: CjValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectCjDropshippingInput = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteCjApiInput = {
  method: string;
  path: string;
};

export type HandleCjWebhookInput = {
  topic: string;
  payloadRef: string;
};
