/** PILLOW-PTC-001 — Portfolio Certified types (X2-21). */

import type {
  CERTIFIED_MODULE_IDS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MODULE_PASS_STATUSES,
  OPERATIONAL_STATES,
  PTC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioCertifiedConfiguration } from "./configuration.js";

export type PortfolioCertifiedVersion = "PILLOW-PTC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PtcCapability = (typeof PTC_CAPABILITIES)[number];
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
  supportedCapabilities: PtcCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: Record<CertifiedModuleId, boolean>;
  metadataVersion: string;
};

export type PortfolioCertificationReport = {
  certificationId: string;
  timestamp: string;
  validationResultsX201ToX220: ModuleCertificationResult[];
  crossModuleIntegrationResult: ModulePassStatus;
  endToEndPortfolioWorkflowResult: ModulePassStatus;
  executiveGovernanceResult: ModulePassStatus;
  overallPortfolioReadinessScore: number;
  warnings: string[];
  errors: string[];
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
    | "certify_portfolio"
    | "validate_cross_module"
    | "validate_end_to_end"
    | "validate_executive_governance"
    | "generate_certification_report"
    | "diagnostics";
  engineRecord: CertificationEngineRecord;
  certificationReports: PortfolioCertificationReport[];
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
  crossModuleRuns: number;
  endToEndRuns: number;
  governanceRuns: number;
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

export type PortfolioCertifiedState = {
  engineVersion: PortfolioCertifiedVersion;
  missionId: "X2-21";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioCertifiedConfiguration;
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
  overallCertificationStatus:
    | PortfolioCertificationReport["overallCertificationStatus"]
    | null;
  overallPortfolioReadinessScore: number | null;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioCertifiedInput = {
  forceReconnect?: boolean;
};

export type CertifyPortfolioInput = {
  scope?: CertifiedModuleId[];
  validated?: boolean;
  runEndToEnd?: boolean;
  runCrossModule?: boolean;
  runExecutiveGovernance?: boolean;
};

export type CertificationActionInput = {
  certificationId?: string;
  scope?: CertifiedModuleId[];
  validated?: boolean;
};
