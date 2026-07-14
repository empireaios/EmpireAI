/** PILLOW-WMT-001 — Walmart Marketplace Integration types (R1-06). */

import type {
  CONNECTION_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  SESSION_STATUSES,
  VALIDATION_STATUSES,
  WALMART_CAPABILITIES,
  AUTHENTICATION_STATUSES,
} from "./paths.js";
import type { WalmartMarketplaceIntegrationConfiguration } from "./configuration.js";

export type WalmartMarketplaceIntegrationEngineVersion = "PILLOW-WMT-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type AuthenticationStatus = (typeof AUTHENTICATION_STATUSES)[number];
export type SessionStatus = (typeof SESSION_STATUSES)[number];
export type ConnectionStatus = (typeof CONNECTION_STATUSES)[number];
export type WalmartCapability = (typeof WALMART_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type WalmartConnectorRecord = {
  connectorId: string;
  timestamp: string;
  marketplaceId: string;
  connectorVersion: string;
  authenticationStatus: AuthenticationStatus;
  apiSessionStatus: SessionStatus;
  connectionStatus: ConnectionStatus;
  supportedCapabilities: WalmartCapability[];
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  credentialRefPresent: boolean;
  frameworkConnectorId: string | null;
};

export type WalmartAuthResult = {
  authenticated: boolean;
  authenticationStatus: AuthenticationStatus;
  sessionStatus: SessionStatus;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type WalmartConnectionTestResult = {
  passed: boolean;
  connectionStatus: ConnectionStatus;
  latencyMs: number;
  endpoint: string;
  details: string;
};

export type WalmartApiRequest = {
  requestId: string;
  method: string;
  path: string;
  timestamp: string;
};

export type WalmartApiResponse = {
  requestId: string;
  statusCode: number;
  normalized: boolean;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type WalmartValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type WalmartConnectorRunReport = {
  connectorRunReportId: string;
  runTimestamp: string;
  action: "connect" | "authenticate" | "test_connection" | "route_api" | "register";
  record: WalmartConnectorRecord;
  validation: WalmartValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type WalmartHealthReport = {
  status: HealthStatus;
  healthScore: number;
  connectorEnabled: boolean;
  authenticationStatus: AuthenticationStatus;
  connectionStatus: ConnectionStatus;
  lastOperationAt: string | null;
  lastValidationDecision: WalmartValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type WalmartPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  authenticationAttempts: number;
  connectionTests: number;
  apiRequests: number;
  rateLimitedRequests: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type WalmartLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type WalmartMarketplaceIntegrationState = {
  engineVersion: WalmartMarketplaceIntegrationEngineVersion;
  missionId: "R1-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: WalmartMarketplaceIntegrationConfiguration;
  latestReport: WalmartConnectorRunReport | null;
  connectorRecord: WalmartConnectorRecord | null;
  health: WalmartHealthReport;
  performance: WalmartPerformanceStats;
};

export type WalmartCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  authenticationStatus: AuthenticationStatus | null;
  connectionStatus: ConnectionStatus | null;
  operationalState: OperationalState | null;
  lastDecision: WalmartValidationReport["decision"] | null;
  apiRequests: number;
  frameworkRegistered: boolean;
  recentLogs: string[];
};

export type ConnectWalmartInput = {
  credentialRef?: string;
  forceReconnect?: boolean;
};

export type RouteWalmartApiInput = {
  method: string;
  path: string;
};
