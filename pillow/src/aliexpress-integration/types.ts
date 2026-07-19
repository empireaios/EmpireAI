/** PILLOW-AEX-001 — AliExpress Integration types (R2-03). */

import type {
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
  AEX_CAPABILITIES,
  AUTHENTICATION_STATUSES,
} from "./paths.js";
import type { AliExpressIntegrationConfiguration } from "./configuration.js";

export type AliExpressIntegrationEngineVersion = "PILLOW-AEX-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type AliExpressCapability = (typeof AEX_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type AliExpressConnectorRecord = {
  connectorId: string;
  timestamp: string;
  supplierId: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: AliExpressCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkSupplierId: string | null;
};

export type AliExpressAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type AliExpressConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type AliExpressApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type AliExpressApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type AliExpressWebhookResult = {
  eventId: string;
  accepted: boolean;
  verified: boolean;
  normalized: boolean;
  details: string;
};

export type AliExpressValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type AliExpressConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_webhook" | "register";
  record: AliExpressConnectorRecord;
  validation: AliExpressValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type AliExpressHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: AliExpressValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type AliExpressPerformanceStats = {
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

export type AliExpressLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AliExpressIntegrationState = {
  engineVersion: AliExpressIntegrationEngineVersion;
  missionId: "R2-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: AliExpressIntegrationConfiguration;
  latestReport: AliExpressConnectorRunReport | null;
  connectorRecord: AliExpressConnectorRecord | null;
  health: AliExpressHealthReport;
  performance: AliExpressPerformanceStats;
};

export type AliExpressCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: AliExpressValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectAliExpressInput = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteAliExpressApiInput = {
  method: string;
  path: string;
};

export type HandleAliExpressWebhookInput = {
  topic: string;
  payloadRef: string;
};
