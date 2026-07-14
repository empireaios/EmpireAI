/** PILLOW-MCF-001 — Marketplace Connector Framework types (R1-01). */

import type {
  AUTHENTICATION_METHODS,
  CONNECTOR_STATES,
  CONNECTOR_TYPES,
  ENGINE_STATUSES,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
} from "./paths.js";
import type { MarketplaceConnectorFrameworkConfiguration } from "./configuration.js";

export type MarketplaceConnectorFrameworkEngineVersion = "PILLOW-MCF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ConnectorState = (typeof CONNECTOR_STATES)[number];
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];
export type AuthenticationMethod = (typeof AUTHENTICATION_METHODS)[number];
export type FrameworkCapability = (typeof FRAMEWORK_CAPABILITIES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type ApiEndpointConfig = {
  baseUrl: string;
  protocol: "rest" | "graphql" | "sdk" | "webhook";
  timeoutMs: number;
  version: string;
};

export type WebhookConfig = {
  enabled: boolean;
  pathPrefix: string;
  signatureHeader: string;
  verifySignatures: boolean;
};

export type RateLimitConfig = {
  enabled: boolean;
  requestsPerMinute: number;
  burstLimit: number;
  windowMs: number;
};

export type RetryConfig = {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
};

export type MarketplaceConnectorDefinition = {
  marketplaceId: string;
  connectorVersion: string;
  connectorType: ConnectorType;
  integrationMissionId?: string;
  authenticationMethod: AuthenticationMethod;
  credentialRef?: string;
  apiEndpointConfig: ApiEndpointConfig;
  webhookConfig: WebhookConfig;
  rateLimitConfig: RateLimitConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type MarketplaceConnectorRecord = {
  connectorId: string;
  timestamp: string;
  marketplaceIdentifier: string;
  connectorVersion: string;
  connectorType: ConnectorType;
  authenticationMethod: AuthenticationMethod;
  apiEndpointConfiguration: ApiEndpointConfig;
  webhookConfiguration: WebhookConfig;
  rateLimitConfiguration: RateLimitConfig;
  retryConfiguration: RetryConfig;
  healthStatus: HealthStatus;
  currentState: ConnectorState;
  supportedCapabilities: FrameworkCapability[];
  metadataVersion: string;
  credentialRefPresent: boolean;
};

export type NormalizedApiRequest = {
  requestId: string;
  marketplaceId: string;
  method: string;
  path: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  bodyRef: string | null;
  timestamp: string;
};

export type NormalizedApiResponse = {
  requestId: string;
  marketplaceId: string;
  statusCode: number;
  normalized: boolean;
  headers: Record<string, string>;
  bodySummary: string;
  errorCode: string | null;
  durationMs: number;
  timestamp: string;
};

export type AuthenticationContext = {
  marketplaceId: string;
  method: AuthenticationMethod;
  credentialRef: string | null;
};

export type AuthenticationResult = {
  authenticated: boolean;
  method: AuthenticationMethod;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type WebhookPayload = {
  eventId: string;
  marketplaceId: string;
  topic: string;
  payloadRef: string;
  receivedAt: string;
};

export type WebhookResult = {
  eventId: string;
  accepted: boolean;
  verified: boolean;
  normalized: boolean;
  details: string;
};

export type ConnectorValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  connectorId: string | null;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type FrameworkRunReport = {
  frameworkRunReportId: string;
  runTimestamp: string;
  action: "register" | "initialize" | "activate" | "suspend" | "shutdown" | "route_api" | "handle_webhook";
  records: MarketplaceConnectorRecord[];
  validation: ConnectorValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredConnectors: number;
  activeConnectors: number;
  suspendedConnectors: number;
  failedConnectors: number;
  lastOperationAt: string | null;
  lastValidationDecision: ConnectorValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type FrameworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalApiRequests: number;
  rateLimitedRequests: number;
  retriedRequests: number;
  webhookEventsHandled: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type FrameworkLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MarketplaceConnectorFrameworkState = {
  engineVersion: MarketplaceConnectorFrameworkEngineVersion;
  missionId: "R1-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: MarketplaceConnectorFrameworkConfiguration;
  latestReport: FrameworkRunReport | null;
  registeredConnectors: MarketplaceConnectorRecord[];
  health: FrameworkHealthReport;
  performance: FrameworkPerformanceStats;
};

export type FrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastDecision: ConnectorValidationReport["decision"] | null;
  registeredConnectorCount: number;
  activeConnectorCount: number;
  totalApiRequests: number;
  rateLimitedRequests: number;
  recoveryAttempts: number;
  recentLogs: string[];
};

export type RegisterConnectorInput = {
  definition: MarketplaceConnectorDefinition;
  sessionId?: string;
  forceRegister?: boolean;
};

export type RouteApiRequestInput = {
  marketplaceId: string;
  method: string;
  path: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
};

export type HandleWebhookInput = {
  marketplaceId: string;
  topic: string;
  payloadRef: string;
};

export interface IMarketplaceConnectorPlugin {
  marketplaceId: string;
  connectorType: ConnectorType;
  supportedCapabilities: FrameworkCapability[];
  initialize(): Promise<void>;
  activate(): Promise<void>;
  suspend(): Promise<void>;
  shutdown(): Promise<void>;
}
