/** PILLOW-1688-001 — 1688 Integration types (R2-04). */

import type {
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
  OSS1688_CAPABILITIES,
  AUTHENTICATION_STATUSES,
} from "./paths.js";
import type { Oss1688IntegrationConfiguration } from "./configuration.js";

export type Oss1688IntegrationEngineVersion = "PILLOW-1688-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type Oss1688Capability = (typeof OSS1688_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type Oss1688ConnectorRecord = {
  connectorId: string;
  timestamp: string;
  supplierId: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: Oss1688Capability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkSupplierId: string | null;
};

export type Oss1688AuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type Oss1688ConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type Oss1688ApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type Oss1688ApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type Oss1688WebhookResult = {
  eventId: string;
  accepted: boolean;
  verified: boolean;
  normalized: boolean;
  details: string;
};

export type Oss1688ValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type Oss1688ConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_webhook" | "register";
  record: Oss1688ConnectorRecord;
  validation: Oss1688ValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type Oss1688HealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: Oss1688ValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type Oss1688PerformanceStats = {
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

export type Oss1688LogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type Oss1688IntegrationState = {
  engineVersion: Oss1688IntegrationEngineVersion;
  missionId: "R2-04";
  status: EngineStatus;
  initializedAt: string;
  configuration: Oss1688IntegrationConfiguration;
  latestReport: Oss1688ConnectorRunReport | null;
  connectorRecord: Oss1688ConnectorRecord | null;
  health: Oss1688HealthReport;
  performance: Oss1688PerformanceStats;
};

export type Oss1688CockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: Oss1688ValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectOss1688Input = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteOss1688ApiInput = {
  method: string;
  path: string;
};

export type HandleOss1688WebhookInput = {
  topic: string;
  payloadRef: string;
};
