/** PILLOW-CFC-001 — Company Factory Certified types (X1-15). */

import type {
  CERTIFIED_MODULE_IDS,
  CFC_CAPABILITIES,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MODULE_PASS_STATUSES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { CompanyFactoryCertifiedConfiguration } from "./configuration.js";

export type CompanyFactoryCertifiedVersion = "PILLOW-CFC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type CfcCapability = (typeof CFC_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type ModulePassStatus = (typeof MODULE_PASS_STATUSES)[number];
export type CertifiedModuleId = (typeof CERTIFIED_MODULE_IDS)[number];

export type ModuleCertificationResult = {
  moduleId: CertifiedModuleId;
  missionId: string;
  status: ModulePassStatus;
  evidenceReference: string;
  notes: string;
};

export type CertificationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: CfcCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: Record<CertifiedModuleId, boolean>;
  metadataVersion: string;
};

export type CompanyFactoryCertificationReport = {
  certificationId: string;
  timestamp: string;
  certifiedCompanyFactoryModules: string;
  opportunityDiscoveryStatus: ModulePassStatus;
  marketValidationStatus: ModulePassStatus;
  businessModelStatus: ModulePassStatus;
  brandCreationStatus: ModulePassStatus;
  storeGenerationStatus: ModulePassStatus;
  productPortfolioStatus: ModulePassStatus;
  launchStatus: ModulePassStatus;
  perModulePassFailStatus: ModuleCertificationResult[];
  warnings: string[];
  errors: string[];
  endToEndValidationResult: ModulePassStatus;
  overallCertificationStatus: "certified" | "partial" | "failed" | "pending";
  evidenceReferences: string;
  certificationFingerprint: string;
  structuralSignalOnly: true;
  modifiedProductionSystemsWithoutSafeTestMode: false;
  fabricatedCertificationFacts: false;
  validationStatus: ValidationStatus;
  metadataVersion: string;
};

export type CertificationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type CertificationRunReport = {
  certificationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "certify_company_factory"
    | "validate_company_framework"
    | "validate_opportunity_discovery"
    | "validate_market_validation"
    | "validate_business_model"
    | "validate_brand"
    | "validate_store"
    | "validate_product_portfolio"
    | "validate_launch"
    | "run_end_to_end_company_creation"
    | "generate_certification_report";
  engineRecord: CertificationEngineRecord;
  certificationReports: CompanyFactoryCertificationReport[];
  validation: CertificationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type CertificationHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: CertificationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalCertificationReports: number;
  notes: string[];
};

export type CertificationPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  certificationsRun: number;
  moduleValidationsRun: number;
  endToEndRuns: number;
  reportRuns: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type CertificationLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "info" | "warn" | "error";
  details: string;
};

export type CompanyFactoryCertifiedState = {
  engineVersion: CompanyFactoryCertifiedVersion;
  missionId: "X1-15";
  status: EngineStatus;
  initializedAt: string;
  configuration: CompanyFactoryCertifiedConfiguration;
  latestReport: CertificationRunReport | null;
  engineRecord: CertificationEngineRecord | null;
  health: CertificationHealthReport;
  performance: CertificationPerformanceStats;
};

export type CertificationCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: CertificationValidationReport["decision"] | null;
  totalCertificationReports: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectCompanyFactoryCertifiedInput = {
  forceReconnect?: boolean;
};

export type CertifyCompanyFactoryInput = {
  scope?: CertifiedModuleId[];
  industry?: string;
  validated?: boolean;
  runEndToEnd?: boolean;
};

export type CertificationActionInput = {
  certificationId?: string;
  scope?: CertifiedModuleId[];
  industry?: string;
  validated?: boolean;
};
