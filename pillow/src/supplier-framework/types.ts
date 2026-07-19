/** PILLOW-SF-001 — Supplier Framework types (R2-01). */

import type {
  AUTHENTICATION_METHODS,
  CONNECTOR_STATES,
  CONNECTOR_TYPES,
  ENGINE_STATUSES,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { SupplierFrameworkConfiguration } from "./configuration.js";

export type SupplierFrameworkEngineVersion = "PILLOW-SF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ConnectorState = (typeof CONNECTOR_STATES)[number];
export type ConnectorType = (typeof CONNECTOR_TYPES)[number];
export type AuthenticationMethod = (typeof AUTHENTICATION_METHODS)[number];
export type FrameworkCapability = (typeof FRAMEWORK_CAPABILITIES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type ApiEndpointConfig = {
  baseUrl: string;
  protocol: "rest" | "graphql" | "sdk" | "webhook";
  timeoutMs: number;
  version: string;
};

export type EventRoutingConfig = {
  enabled: boolean;
  topics: string[];
  maxEventsPerMinute: number;
  windowMs: number;
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

export type SupplierConnectorDefinition = {
  supplierIdentifier: string;
  connectorVersion: string;
  connectorType: ConnectorType;
  integrationMissionId?: string;
  authenticationMethod: AuthenticationMethod;
  credentialRef?: string;
  apiEndpointConfig: ApiEndpointConfig;
  eventRoutingConfig: EventRoutingConfig;
  rateLimitConfig: RateLimitConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type SupplierFrameworkRecord = {
  frameworkId: string;
  timestamp: string;
  supplierIdentifier: string;
  connectorVersion: string;
  connectorStatus: ConnectorState;
  supportedCapabilities: FrameworkCapability[];
  validationStatus: ValidationStatus;
  healthStatus: HealthStatus;
  operationalState: ConnectorState;
  metadataVersion: string;
  connectorType: ConnectorType;
  authenticationMethod: AuthenticationMethod;
  apiEndpointConfiguration: ApiEndpointConfig;
  eventRoutingConfiguration: EventRoutingConfig;
  rateLimitConfiguration: RateLimitConfig;
  retryConfiguration: RetryConfig;
  credentialRefPresent: boolean;
};

export type NormalizedSupplierEvent = {
  eventId: string;
  supplierIdentifier: string;
  topic: string;
  payloadRef: string;
  routed: boolean;
  timestamp: string;
};

export type SupplierEventResult = {
  eventId: string;
  accepted: boolean;
  routed: boolean;
  normalized: boolean;
  details: string;
};

export type AbstractedSupplierData = {
  dataId: string;
  supplierIdentifier: string;
  dataType: string;
  payloadRef: string;
  abstracted: boolean;
  fieldCount: number;
  timestamp: string;
};

export type AuthenticationContext = {
  supplierIdentifier: string;
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

export type SupplierValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  frameworkId: string | null;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type FrameworkRunReport = {
  frameworkRunReportId: string;
  runTimestamp: string;
  action:
    | "register"
    | "initialize"
    | "activate"
    | "suspend"
    | "shutdown"
    | "route_event"
    | "abstract_data"
    | "diagnostics";
  records: SupplierFrameworkRecord[];
  validation: SupplierValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredSuppliers: number;
  activeSuppliers: number;
  suspendedSuppliers: number;
  failedSuppliers: number;
  lastOperationAt: string | null;
  lastValidationDecision: SupplierValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type FrameworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalEventsRouted: number;
  rateLimitedEvents: number;
  dataAbstractions: number;
  retryAttempts: number;
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

export type SupplierFrameworkState = {
  engineVersion: SupplierFrameworkEngineVersion;
  missionId: "R2-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: SupplierFrameworkConfiguration;
  latestReport: FrameworkRunReport | null;
  registeredSuppliers: SupplierFrameworkRecord[];
  health: FrameworkHealthReport;
  performance: FrameworkPerformanceStats;
};

export type FrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastDecision: SupplierValidationReport["decision"] | null;
  registeredSupplierCount: number;
  activeSupplierCount: number;
  totalEventsRouted: number;
  rateLimitedEvents: number;
  recoveryAttempts: number;
  recentLogs: string[];
};

export type RegisterSupplierInput = {
  definition: SupplierConnectorDefinition;
  forceRegister?: boolean;
};

export type RouteSupplierEventInput = {
  supplierIdentifier: string;
  topic: string;
  payloadRef: string;
};

export type AbstractSupplierDataInput = {
  supplierIdentifier: string;
  dataType: string;
  payloadRef: string;
};

export type RunDiagnosticsInput = {
  supplierIdentifier?: string;
};

export interface ISupplierConnectorPlugin {
  supplierIdentifier: string;
  connectorType: ConnectorType;
  supportedCapabilities: FrameworkCapability[];
  initialize(): Promise<void>;
  activate(): Promise<void>;
  suspend(): Promise<void>;
  shutdown(): Promise<void>;
}
