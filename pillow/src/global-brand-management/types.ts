/** PILLOW-GBM-001 — Global Brand Management types (X4-11). */

import type {
  BRAND_CATEGORIES,
  COMPLIANCE_STATUSES,
  ENGINE_STATUSES,
  GBM_CAPABILITIES,
  HEALTH_STATUSES,
  OPERATIONAL_STATES,
  RISK_LEVELS,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { GlobalBrandManagementConfiguration } from "./configuration.js";

export type GlobalBrandManagementVersion = "PILLOW-GBM-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type GbmCapability = (typeof GBM_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type BrandCategory = (typeof BRAND_CATEGORIES)[number];
export type ComplianceStatus = (typeof COMPLIANCE_STATUSES)[number];
export type RiskLevel = (typeof RISK_LEVELS)[number];

export type BrandGovernanceRecord = {
  brandGovernanceId: string;
  timestamp: string;
  companyReference: string;
  brandReference: string;
  region: string;
  brandConsistencyScore: number;
  reputationScore: number;
  complianceStatus: ComplianceStatus;
  recommendationSummary: string;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  brandCategory: BrandCategory;
  riskLevel: RiskLevel;
  inconsistencyDetected: boolean;
  reputationRiskDetected: boolean;
  protectedAssetModificationAttempted: boolean;
  brandTraceId: string;
  structuralSignalOnly: true;
  neverModifyProtectedBrandAssetsWithoutAuthorization: true;
  protectedAssetModificationClaim: "none";
};

export type GlobalBrandManagementEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: GbmCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
    localizationEngine: boolean;
    languageIntelligence: boolean;
    currencyIntelligence: boolean;
    regionalComplianceEngine: boolean;
    globalTaxIntelligence: boolean;
    internationalLogisticsEngine: boolean;
    globalMarketIntelligence: boolean;
    executiveGlobalDashboard: boolean;
  };
  metadataVersion: string;
};

export type BrandRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  brandReference: string;
  region: string;
  brandCategory: BrandCategory;
  riskLevel: RiskLevel;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverModifyProtectedBrandAssetsWithoutAuthorization: true;
  protectedAssetModificationClaim: "none";
};

export type BrandValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type GbmRunReport = {
  brandRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "manage_worldwide_identity"
    | "manage_regional_adaptations"
    | "manage_brand_consistency"
    | "monitor_brand_performance"
    | "monitor_brand_reputation"
    | "monitor_brand_compliance"
    | "detect_brand_inconsistencies"
    | "detect_reputation_risks"
    | "recommend_brand"
    | "diagnostics";
  engineRecord: GlobalBrandManagementEngineRecord;
  brandRecords: BrandGovernanceRecord[];
  recommendations: BrandRecommendation[];
  validation: BrandValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type GbmHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: BrandValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalBrandRecords: number;
  inconsistencyCount: number;
  reputationRiskCount: number;
  notes: string[];
};

export type GbmPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  identityOps: number;
  regionalAdaptationOps: number;
  consistencyOps: number;
  performanceMonitors: number;
  reputationMonitors: number;
  complianceMonitors: number;
  inconsistencyDetections: number;
  reputationRiskDetections: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type GlobalBrandManagementState = {
  engineVersion: GlobalBrandManagementVersion;
  missionId: "X4-11";
  status: EngineStatus;
  initializedAt: string;
  configuration: GlobalBrandManagementConfiguration;
  latestReport: GbmRunReport | null;
  engineRecord: GlobalBrandManagementEngineRecord | null;
  health: GbmHealthReport;
  performance: GbmPerformanceStats;
};

export type GbmCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: BrandValidationReport["decision"] | null;
  totalBrandRecords: number;
  inconsistencyCount: number;
  reputationRiskCount: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type GbmLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectGlobalBrandManagementInput = Record<string, unknown>;

export type BrandAnalysisInput = {
  companyReference?: string;
  brandReference?: string;
  region?: string;
  brandCategory?: BrandCategory;
  consistencyHint?: number;
  reputationHint?: number;
  inconsistencyHint?: boolean;
  reputationRiskHint?: boolean;
  authorizeProtectedAssetModification?: boolean;
  validated?: boolean;
};

export type RunGbmDiagnosticsInput = {
  companyReference?: string;
  brandReference?: string;
  region?: string;
};
