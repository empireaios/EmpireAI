/** PILLOW-MCR-001 — Multi-Company Registry types (X2-02). */

import type {
  COMPANY_CATEGORIES,
  COMPANY_OPERATIONAL_STATUSES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LIFECYCLE_STAGES,
  MCR_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { MultiCompanyRegistryConfiguration } from "./configuration.js";

export type MultiCompanyRegistryVersion = "PILLOW-MCR-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CompanyCategory = (typeof COMPANY_CATEGORIES)[number];
export type LifecycleStage = (typeof LIFECYCLE_STAGES)[number];
export type CompanyOperationalStatus = (typeof COMPANY_OPERATIONAL_STATUSES)[number];
export type McrCapability = (typeof MCR_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];

export type RegistryEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: McrCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    enterprisePortfolioFramework: boolean;
  };
  metadataVersion: string;
};

export type CompanyRegistryRecord = {
  companyRegistryId: string;
  timestamp: string;
  companyId: string;
  companyName: string;
  companyCategory: CompanyCategory;
  companyLifecycleStage: LifecycleStage;
  operationalStatus: CompanyOperationalStatus;
  ownershipReference: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  identityKey: string;
  structuralSignalOnly: true;
  bypassedValidation: false;
};

export type RegistryRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyId: string | null;
  recommendationType:
    | "register"
    | "update_profile"
    | "reclassify"
    | "advance_lifecycle"
    | "resolve_duplicate"
    | "activate"
    | "archive";
  rationale: string;
  priority: "low" | "medium" | "high";
  structuralSignalOnly: true;
};

export type RegistryValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type RegistryRunReport = {
  registryRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "register_company"
    | "update_profile"
    | "update_ownership"
    | "classify"
    | "advance_lifecycle"
    | "detect_duplicates"
    | "recommend"
    | "diagnostics";
  engineRecord: RegistryEngineRecord;
  companyRecords: CompanyRegistryRecord[];
  recommendations: RegistryRecommendation[];
  validation: RegistryValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type RegistryHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: RegistryValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCompanyRecords: number;
  activeCompanies: number;
  duplicateSignals: number;
  notes: string[];
};

export type RegistryPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  companiesRegistered: number;
  profileUpdates: number;
  classifications: number;
  lifecycleTransitions: number;
  duplicatesDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type RegistryLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type MultiCompanyRegistryState = {
  engineVersion: MultiCompanyRegistryVersion;
  missionId: "X2-02";
  status: EngineStatus;
  initializedAt: string;
  configuration: MultiCompanyRegistryConfiguration;
  latestReport: RegistryRunReport | null;
  engineRecord: RegistryEngineRecord | null;
  health: RegistryHealthReport;
  performance: RegistryPerformanceStats;
};

export type RegistryCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: RegistryValidationReport["decision"] | null;
  totalCompanyRecords: number;
  activeCompanies: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectMultiCompanyRegistryInput = {
  forceReconnect?: boolean;
};

export type RegisterCompanyInput = {
  companyId?: string;
  companyName: string;
  companyCategory?: CompanyCategory;
  companyLifecycleStage?: LifecycleStage;
  operationalStatus?: CompanyOperationalStatus;
  ownershipReference?: string;
  validated?: boolean;
  allowDuplicate?: boolean;
};

export type UpdateCompanyProfileInput = {
  companyId: string;
  companyName?: string;
  companyCategory?: CompanyCategory;
  operationalStatus?: CompanyOperationalStatus;
  ownershipReference?: string;
  validated?: boolean;
};

export type UpdateOwnershipInput = {
  companyId: string;
  ownershipReference: string;
  validated?: boolean;
};

export type ClassifyCompanyInput = {
  companyId: string;
  companyCategory: CompanyCategory;
  validated?: boolean;
};

export type AdvanceLifecycleInput = {
  companyId: string;
  companyLifecycleStage: LifecycleStage;
  validated?: boolean;
};

export type DetectDuplicatesInput = {
  companyId?: string;
};

export type RecommendRegistryInput = {
  companyId?: string;
};

export type RunRegistryDiagnosticsInput = {
  companyId?: string;
};
