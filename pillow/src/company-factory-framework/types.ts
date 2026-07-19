/** PILLOW-CFF-001 — Company Factory Framework types (X1-01). */

import type {
  AUTHENTICATION_METHODS,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  ENGINE_STATUSES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CompanyFactoryFrameworkConfiguration } from "./configuration.js";

export type CompanyFactoryFrameworkEngineVersion = "PILLOW-CFF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ModuleState = (typeof MODULE_STATES)[number];
export type ModuleType = (typeof MODULE_TYPES)[number];
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

export type CompanyModuleDefinition = {
  companyModuleIdentifier: string;
  moduleVersion: string;
  moduleType: ModuleType;
  integrationMissionId?: string;
  authenticationMethod: AuthenticationMethod;
  credentialRef?: string;
  apiEndpointConfig: ApiEndpointConfig;
  eventRoutingConfig: EventRoutingConfig;
  rateLimitConfig: RateLimitConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type CompanyFactoryFrameworkRecord = {
  frameworkId: string;
  timestamp: string;
  companyModuleIdentifier: string;
  moduleVersion: string;
  moduleStatus: ModuleState;
  supportedCapabilities: FrameworkCapability[];
  validationStatus: ValidationStatus;
  healthStatus: HealthStatus;
  operationalState: ModuleState;
  metadataVersion: string;
  moduleType: ModuleType;
  authenticationMethod: AuthenticationMethod;
  apiEndpointConfiguration: ApiEndpointConfig;
  eventRoutingConfiguration: EventRoutingConfig;
  rateLimitConfiguration: RateLimitConfig;
  retryConfiguration: RetryConfig;
  credentialRefPresent: boolean;
};

export type NormalizedCompanyEvent = {
  eventId: string;
  companyModuleIdentifier: string;
  topic: string;
  payloadRef: string;
  routed: boolean;
  timestamp: string;
};

export type CompanyEventResult = {
  eventId: string;
  accepted: boolean;
  routed: boolean;
  normalized: boolean;
  details: string;
};

export type AbstractedCompanyData = {
  dataId: string;
  companyModuleIdentifier: string;
  dataType: string;
  payloadRef: string;
  abstracted: boolean;
  fieldCount: number;
  timestamp: string;
};

export type CredentialContext = {
  companyModuleIdentifier: string;
  method: AuthenticationMethod;
  credentialRef: string | null;
};

export type CredentialValidationResult = {
  validated: boolean;
  method: AuthenticationMethod;
  credentialRefPresent: boolean;
  tokenExposed: false;
  details: string;
};

export type CompanyValidationReport = {
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
  records: CompanyFactoryFrameworkRecord[];
  validation: CompanyValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type FrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredModules: number;
  activeModules: number;
  suspendedModules: number;
  failedModules: number;
  lastOperationAt: string | null;
  lastValidationDecision: CompanyValidationReport["decision"] | null;
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

export type CompanyFactoryFrameworkState = {
  engineVersion: CompanyFactoryFrameworkEngineVersion;
  missionId: "X1-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: CompanyFactoryFrameworkConfiguration;
  latestReport: FrameworkRunReport | null;
  registeredModules: CompanyFactoryFrameworkRecord[];
  health: FrameworkHealthReport;
  performance: FrameworkPerformanceStats;
};

export type FrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  lastDecision: CompanyValidationReport["decision"] | null;
  registeredModuleCount: number;
  activeModuleCount: number;
  totalEventsRouted: number;
  rateLimitedEvents: number;
  recoveryAttempts: number;
  recentLogs: string[];
};

export type RegisterCompanyModuleInput = {
  definition: CompanyModuleDefinition;
  forceRegister?: boolean;
};

export type RouteCompanyEventInput = {
  companyModuleIdentifier: string;
  topic: string;
  payloadRef: string;
};

export type AbstractCompanyDataInput = {
  companyModuleIdentifier: string;
  dataType: string;
  payloadRef: string;
};

export type RunDiagnosticsInput = {
  companyModuleIdentifier?: string;
};

export interface ICompanyModulePlugin {
  companyModuleIdentifier: string;
  moduleType: ModuleType;
  supportedCapabilities: FrameworkCapability[];
  initialize(): Promise<void>;
  activate(): Promise<void>;
  suspend(): Promise<void>;
  shutdown(): Promise<void>;
}
