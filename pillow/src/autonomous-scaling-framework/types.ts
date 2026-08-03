/** PILLOW-ASF-001 — Autonomous Scaling Framework types (X3-01). */

import type {
  ENGINE_STATUSES,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { AutonomousScalingFrameworkConfiguration } from "./configuration.js";

export type AutonomousScalingFrameworkVersion = "PILLOW-ASF-001";
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

export type ScalingModuleDefinition = {
  scalingModuleIdentifier: string;
  moduleVersion: string;
  moduleType: ModuleType;
  integrationMissionId?: string;
  eventRoutingConfig: EventRoutingConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type AutonomousScalingFrameworkRecord = {
  scalingFrameworkId: string;
  timestamp: string;
  scalingModuleIdentifier: string;
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

export type NormalizedScalingEvent = {
  eventId: string;
  scalingModuleIdentifier: string;
  topic: string;
  payloadRef: string;
  routed: boolean;
  timestamp: string;
};

export type ScalingEventResult = {
  eventId: string;
  accepted: boolean;
  routed: boolean;
  normalized: boolean;
  details: string;
};

export type AbstractedScalingData = {
  dataId: string;
  scalingModuleIdentifier: string;
  dataType: string;
  payloadRef: string;
  abstracted: boolean;
  fieldCount: number;
  timestamp: string;
};

export type ScalingValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  scalingFrameworkId: string | null;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type ScalingFrameworkRunReport = {
  scalingFrameworkRunReportId: string;
  runTimestamp: string;
  action:
    | "register_module"
    | "activate"
    | "suspend"
    | "shutdown"
    | "route_event"
    | "abstract_data"
    | "diagnostics";
  records: AutonomousScalingFrameworkRecord[];
  validation: ScalingValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type ScalingFrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredModules: number;
  activeModules: number;
  suspendedModules: number;
  failedModules: number;
  lastOperationAt: string | null;
  lastValidationDecision: ScalingValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type ScalingFrameworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalEventsRouted: number;
  dataAbstractions: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type ScalingFrameworkLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type AutonomousScalingFrameworkState = {
  engineVersion: AutonomousScalingFrameworkVersion;
  missionId: "X3-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: AutonomousScalingFrameworkConfiguration;
  latestReport: ScalingFrameworkRunReport | null;
  registeredModules: AutonomousScalingFrameworkRecord[];
  health: ScalingFrameworkHealthReport;
  performance: ScalingFrameworkPerformanceStats;
};

export type ScalingFrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  registeredModules: number;
  activeModules: number;
  lastDecision: ScalingValidationReport["decision"] | null;
  recentLogs: string[];
};

export type RegisterScalingModuleInput = {
  definition: ScalingModuleDefinition;
  forceRegister?: boolean;
};

export type RouteScalingEventInput = {
  scalingModuleIdentifier: string;
  topic: string;
  payloadRef?: string;
};

export type AbstractScalingDataInput = {
  scalingModuleIdentifier: string;
  dataType: string;
  payloadRef?: string;
  fields?: string[];
};

export type RunScalingDiagnosticsInput = {
  scalingModuleIdentifier?: string;
};
