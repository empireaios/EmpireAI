/** PILLOW-ETSY-001 — Etsy Marketplace Integration types (R1-07). */

import type {
  AUTHENTICATION_STATUSES,
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  ETSY_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { EtsyMarketplaceIntegrationConfiguration } from "./configuration.js";

export type EtsyMarketplaceIntegrationEngineVersion = "PILLOW-ETSY-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type EtsyCapability = (typeof ETSY_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type EtsyConnectorRecord = {
  connectorId: string;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedEtsyCapabilities: EtsyCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type EtsyAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type EtsyConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type EtsyApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type EtsyApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type EtsyEventResult = {
  eventId: string;
  topic: string;
  accepted: boolean;
  verified: boolean;
  details: string;
};

export type EtsyValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type EtsyConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "handle_event" | "register";
  record: EtsyConnectorRecord;
  validation: EtsyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type EtsyHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: EtsyValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type EtsyPerformanceStats = {
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

export type EtsyLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type EtsyMarketplaceIntegrationState = {
  engineVersion: EtsyMarketplaceIntegrationEngineVersion;
  missionId: "R1-07";
  status: EngineStatus;
  initializedAt: string;
  configuration: EtsyMarketplaceIntegrationConfiguration;
  latestReport: EtsyConnectorRunReport | null;
  connectorRecord: EtsyConnectorRecord | null;
  health: EtsyHealthReport;
  performance: EtsyPerformanceStats;
};

export type EtsyCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: EtsyValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectEtsyInput = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteEtsyApiInput = {
  method: string;
  path: string;
};

export type HandleEtsyEventInput = {
  topic: string;
  payloadRef: string;
};
