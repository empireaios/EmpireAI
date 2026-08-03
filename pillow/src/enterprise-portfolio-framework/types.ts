/** PILLOW-EPF-001 — Enterprise Portfolio Framework types (X2-01). */

import type {
  ENGINE_STATUSES,
  FRAMEWORK_CAPABILITIES,
  HEALTH_STATUSES,
  MODULE_STATES,
  MODULE_TYPES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { EnterprisePortfolioFrameworkConfiguration } from "./configuration.js";

export type EnterprisePortfolioFrameworkVersion = "PILLOW-EPF-001";
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

export type PortfolioModuleDefinition = {
  portfolioModuleIdentifier: string;
  moduleVersion: string;
  moduleType: ModuleType;
  integrationMissionId?: string;
  eventRoutingConfig: EventRoutingConfig;
  retryConfig: RetryConfig;
  supportedCapabilities: FrameworkCapability[];
};

export type RegisteredCompanyRef = {
  companyReference: string;
  registeredAt: string;
  isolationKey: string;
  structuralSignalOnly: true;
};

export type EnterprisePortfolioFrameworkRecord = {
  portfolioFrameworkId: string;
  timestamp: string;
  portfolioModuleIdentifier: string;
  moduleVersion: string;
  registeredCompanies: string[];
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

export type NormalizedPortfolioEvent = {
  eventId: string;
  portfolioModuleIdentifier: string;
  companyReference: string | null;
  topic: string;
  payloadRef: string;
  routed: boolean;
  timestamp: string;
};

export type PortfolioEventResult = {
  eventId: string;
  accepted: boolean;
  routed: boolean;
  normalized: boolean;
  details: string;
};

export type AbstractedPortfolioData = {
  dataId: string;
  portfolioModuleIdentifier: string;
  companyReference: string | null;
  dataType: string;
  payloadRef: string;
  abstracted: boolean;
  fieldCount: number;
  timestamp: string;
};

export type PortfolioValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  portfolioFrameworkId: string | null;
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type PortfolioFrameworkRunReport = {
  portfolioFrameworkRunReportId: string;
  runTimestamp: string;
  action:
    | "register_module"
    | "register_company"
    | "activate"
    | "suspend"
    | "shutdown"
    | "route_event"
    | "abstract_data"
    | "diagnostics";
  records: EnterprisePortfolioFrameworkRecord[];
  companies: RegisteredCompanyRef[];
  validation: PortfolioValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type PortfolioFrameworkHealthReport = {
  status: HealthStatus;
  healthScore: number;
  frameworkEnabled: boolean;
  registeredModules: number;
  activeModules: number;
  registeredCompanies: number;
  suspendedModules: number;
  failedModules: number;
  lastOperationAt: string | null;
  lastValidationDecision: PortfolioValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  notes: string[];
};

export type PortfolioFrameworkPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  totalEventsRouted: number;
  companiesRegistered: number;
  dataAbstractions: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type PortfolioFrameworkLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type EnterprisePortfolioFrameworkState = {
  engineVersion: EnterprisePortfolioFrameworkVersion;
  missionId: "X2-01";
  status: EngineStatus;
  initializedAt: string;
  configuration: EnterprisePortfolioFrameworkConfiguration;
  latestReport: PortfolioFrameworkRunReport | null;
  registeredModules: EnterprisePortfolioFrameworkRecord[];
  registeredCompanies: RegisteredCompanyRef[];
  health: PortfolioFrameworkHealthReport;
  performance: PortfolioFrameworkPerformanceStats;
};

export type PortfolioFrameworkCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  registeredModules: number;
  registeredCompanies: number;
  activeModules: number;
  lastDecision: PortfolioValidationReport["decision"] | null;
  recentLogs: string[];
};

export type RegisterPortfolioModuleInput = {
  definition: PortfolioModuleDefinition;
  forceRegister?: boolean;
};

export type RegisterPortfolioCompanyInput = {
  companyReference: string;
  portfolioModuleIdentifier?: string;
  validated?: boolean;
};

export type RoutePortfolioEventInput = {
  portfolioModuleIdentifier: string;
  topic: string;
  payloadRef?: string;
  companyReference?: string;
};

export type AbstractPortfolioDataInput = {
  portfolioModuleIdentifier: string;
  dataType: string;
  payloadRef?: string;
  companyReference?: string;
  fields?: string[];
};

export type RunPortfolioDiagnosticsInput = {
  portfolioModuleIdentifier?: string;
};
