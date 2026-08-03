/** PILLOW-GEF-001 — Global Expansion Framework types (X4-01). */

import type {
  ENGINE_STATUSES,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GlobalExpansionFrameworkConfiguration } from "./configuration.js";

export type GlobalExpansionFrameworkVersion = "PILLOW-GEF-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type ModuleState = (typeof MODULE_STATES)[number];
export type ModuleType = (typeof MODULE_TYPES)[number];
export type FrameworkCapability = (typeof FRAMEWORK_CAPABILITIES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];

export type EventRoutingConfig = {
  enabled: boolean;
  topics: string[];
  maxEventsPerMinute: number;
  windowMs: number;
};

export type RetryConfig = {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier: number;
};

export type ExpansionModuleDefinition = {
  expansionModuleIdentifier: string;
  moduleVersion: string;
  moduleType: ModuleType;
  integrationMissionId?: string;
  eventRoutingConfig: EventRoutingConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type GlobalExpansionFrameworkRecord = {
  expansionFrameworkId: string;
  timestamp: string;
  expansionModuleIdentifier: string;
  moduleVersion: string;
  validationStatus: ValidationStatus;
  healthStatus: HealthStatus;
  operationalState: ModuleState;
  supportedCapabilities: FrameworkCapability[];
  metadataVersion: string;
  moduleType: ModuleType;
  moduleStatus: ModuleState;
  eventRoutingConfiguration: EventRoutingConfig;
  retryConfiguration: RetryConfig;
  structuralSignalOnly: true;
  bypassedValidation: false;
};

export type NormalizedExpansionEvent = {
  eventId: string;
  expansionModuleIdentifier: string;
  topic: string;
  payloadRef: string;
  routed: boolean;
  timestamp: string;
};

export type ExpansionEventResult = {
  eventId: string;
  accepted: boolean;
  routed: boolean;
  normalized: boolean;
  details: string;
};

export type AbstractedRegionalData = {
  dataId: string;
  expansionModuleIdentifier: string;
  dataType: string;
  payloadRef: string;
  abstracted: boolean;
  fieldCount: number;
  timestamp: string;
};

export type ExpansionValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  expansionFrameworkId: string | null;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ExpansionFrameworkRunReport = {
  expansionFrameworkRunReportId: string;
  runTimestamp: string;
  action:
    | "register_module"
    | "activate"
    | "suspend"
    | "shutdown"
    | "route_event"
    | "abstract_data"
    | "diagnostics";
  records: GlobalExpansionFrameworkRecord[];
  validation: ExpansionValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ExpansionFrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredModules: number;
  activeModules: number;
  suspendedModules: number;
  failedModules: number;
  lastOperationAt: string | null;
  lastValidationDecision: ExpansionValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ExpansionFrameworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalEventsRouted: number;
  dataAbstractions: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ExpansionFrameworkLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type GlobalExpansionFrameworkState = {
  engineVersion: GlobalExpansionFrameworkVersion;
  missionId: "X4-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalExpansionFrameworkConfiguration;
  latestReport: ExpansionFrameworkRunReport | null;
  registeredModules: GlobalExpansionFrameworkRecord[];
  health: ExpansionFrameworkHealthReport;
  performance: ExpansionFrameworkPerformanceStats;
};

export type ExpansionFrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  registeredModules: number;
  activeModules: number;
  lastDecision: ExpansionValidationReport["decision"] | null;
  recentLogs: string[];
};

export type RegisterExpansionModuleInput = {
  definition: ExpansionModuleDefinition;
  forceRegister?: boolean;
};

export type RouteExpansionEventInput = {
  expansionModuleIdentifier: string;
  topic: string;
  payloadRef?: string;
};

export type AbstractRegionalDataInput = {
  expansionModuleIdentifier: string;
  dataType: string;
  payloadRef?: string;
  fields?: string[];
};

export type RunExpansionDiagnosticsInput = {
  expansionModuleIdentifier?: string;
};
