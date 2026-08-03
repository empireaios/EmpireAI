/** PILLOW-DAP-001 — Domain & Digital Asset Planner types (X1-06). */

import type {
  DAP_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { DomainDigitalAssetPlannerConfiguration } from "./configuration.js";

export type DomainDigitalAssetPlannerVersion = "PILLOW-DAP-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type DapCapability = (typeof DAP_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type DigitalAssetEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: DapCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    companyFactoryFramework: boolean;
    businessModelGenerator: boolean;
    brandCreationEngine: boolean;
  };
  metadataVersion: string;
};

export type DigitalAssetPlanRecord = {
  digitalAssetPlanId: string;
  timestamp: string;
  brandReference: string;
  proposedCompanyDomain: string;
  alternativeDomains: string;
  socialMediaHandlePlan: string;
  emailDomainPlan: string;
  brandAssetStructure: string;
  websiteArchitectureSummary: string;
  digitalIdentityConsistency: string;
  namingConflictSummary: string;
  recommendations: string;
  planFingerprint: string;
  structuralSignalOnly: true;
  automaticRegistrationOrPurchase: false;
  fabricatedDigitalAssetFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type DigitalAssetValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type DigitalAssetRunReport = {
  digitalAssetRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "create_plan"
    | "plan_company_domains"
    | "plan_domain_alternatives"
    | "plan_social_handles"
    | "plan_email_domains"
    | "plan_brand_asset_structure"
    | "plan_website_architecture"
    | "plan_digital_identity_consistency"
    | "detect_naming_conflicts"
    | "generate_recommendations";
  engineRecord: DigitalAssetEngineRecord;
  planRecords: DigitalAssetPlanRecord[];
  validation: DigitalAssetValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type DigitalAssetHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: DigitalAssetValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalPlanRecords: number;
  notes: string[];
};

export type DigitalAssetPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  plansCreated: number;
  domainPlanningRuns: number;
  socialPlanningRuns: number;
  websitePlanningRuns: number;
  conflictDetectionRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type DigitalAssetLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type DomainDigitalAssetPlannerState = {
  engineVersion: DomainDigitalAssetPlannerVersion;
  missionId: "X1-06";
  status: EngineStatus;
  initializedAt: string;
  configuration: DomainDigitalAssetPlannerConfiguration;
  latestReport: DigitalAssetRunReport | null;
  engineRecord: DigitalAssetEngineRecord | null;
  health: DigitalAssetHealthReport;
  performance: DigitalAssetPerformanceStats;
};

export type DigitalAssetCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: DigitalAssetValidationReport["decision"] | null;
  totalPlanRecords: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectDomainDigitalAssetPlannerInput = {
  forceReconnect?: boolean;
};

export type CreateDigitalAssetPlanInput = {
  brandReference?: string;
  companyNameHint?: string;
  industry?: string;
  validated?: boolean;
};

export type DigitalAssetActionInput = {
  digitalAssetPlanId?: string;
  brandReference?: string;
  companyNameHint?: string;
  industry?: string;
  validated?: boolean;
};
