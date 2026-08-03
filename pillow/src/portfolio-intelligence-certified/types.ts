/** PILLOW-PIC-001 — Portfolio Intelligence Certified types (X2-10). */

import type {
  CERTIFIED_MODULE_IDS,
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  MODULE_PASS_STATUSES,
  OPERATIONAL_STATES,
  PIC_CAPABILITIES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { PortfolioIntelligenceCertifiedConfiguration } from "./configuration.js";

export type PortfolioIntelligenceCertifiedVersion = "PILLOW-PIC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type PicCapability = (typeof PIC_CAPABILITIES)[number];
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
  supportedCapabilities: PicCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: Record<CertifiedModuleId, boolean>;
  metadataVersion: string;
};

export type PortfolioIntelligenceCertificationReport = {
  certificationId: string;
  timestamp: string;
  enterprisePortfolioFrameworkStatus: ModulePassStatus;
  companyRegistryStatus: ModulePassStatus;
  portfolioAnalyticsStatus: ModulePassStatus;
  knowledgeSharingStatus: ModulePassStatus;
  capitalDistributionStatus: ModulePassStatus;
  executiveDashboardStatus: ModulePassStatus;
  portfolioRiskStatus: ModulePassStatus;
  portfolioBalanceStatus: ModulePassStatus;
  businessHealthRankingStatus: ModulePassStatus;
  perModulePassFailStatus: ModuleCertificationResult[];
  warnings: string[];
  errors: string[];
  endToEndPortfolioValidationResult: ModulePassStatus;
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
    | "certify_portfolio_intelligence"
    | "validate_enterprise_portfolio"
    | "validate_company_registry"
    | "validate_portfolio_analytics"
    | "validate_knowledge_sharing"
    | "validate_capital_distribution"
    | "validate_executive_dashboard"
    | "validate_portfolio_risk"
    | "validate_portfolio_balance"
    | "validate_business_health"
    | "run_end_to_end_portfolio"
    | "generate_certification_report";
  engineRecord: CertificationEngineRecord;
  certificationReports: PortfolioIntelligenceCertificationReport[];
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

export type PortfolioIntelligenceCertifiedState = {
  engineVersion: PortfolioIntelligenceCertifiedVersion;
  missionId: "X2-10";
  status: EngineStatus;
  initializedAt: string;
  configuration: PortfolioIntelligenceCertifiedConfiguration;
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
    | PortfolioIntelligenceCertificationReport["overallCertificationStatus"]
    | null;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type ConnectPortfolioIntelligenceCertifiedInput = {
  forceReconnect?: boolean;
};

export type CertifyPortfolioIntelligenceInput = {
  scope?: CertifiedModuleId[];
  validated?: boolean;
  runEndToEnd?: boolean;
};

export type CertificationActionInput = {
  certificationId?: string;
  scope?: CertifiedModuleId[];
  validated?: boolean;
};
