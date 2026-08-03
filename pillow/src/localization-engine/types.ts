/** PILLOW-LOC-001 — Localization Engine types (X4-03). */

import type {
  ENGINE_STATUSES,
  HEALTH_STATUSES,
  LOCALIZATION_CATEGORIES,
  LOC_CAPABILITIES,
  OPERATIONAL_STATES,
  VALIDATION_STATUSES,
} from "./paths.js";
import type { LocalizationEngineConfiguration } from "./configuration.js";

export type LocalizationEngineVersion = "PILLOW-LOC-001";
export type EngineStatus = (typeof ENGINE_STATUSES)[number];
export type OperationalState = (typeof OPERATIONAL_STATES)[number];
export type LocCapability = (typeof LOC_CAPABILITIES)[number];
export type ValidationStatus = (typeof VALIDATION_STATUSES)[number];
export type HealthStatus = (typeof HEALTH_STATUSES)[number];
export type LocalizationCategory = (typeof LOCALIZATION_CATEGORIES)[number];

export type LocalizationRecord = {
  localizationId: string;
  timestamp: string;
  companyReference: string;
  targetCountry: string;
  targetRegion: string;
  localizationCategory: LocalizationCategory;
  adaptationSummary: string;
  readinessScore: number;
  validationStatus: ValidationStatus;
  metadataVersion: string;
  gapScore: number;
  canonicalSourcePreserved: true;
  structuralSignalOnly: true;
  neverOverwriteCanonicalSourceContent: true;
};

export type LocalizationEngineRecord = {
  engineRecordId: string;
  timestamp: string;
  engineId: string;
  engineVersion: string;
  currentOperationalState: OperationalState;
  healthStatus: HealthStatus;
  validationStatus: ValidationStatus;
  supportedCapabilities: LocCapability[];
  frameworkModuleId: string | null;
  dependencyPresence: {
    globalExpansionFramework: boolean;
    countryIntelligenceEngine: boolean;
  };
  metadataVersion: string;
};

export type LocalizationRecommendation = {
  recommendationId: string;
  timestamp: string;
  companyReference: string;
  targetCountry: string;
  localizationCategory: LocalizationCategory;
  readinessScore: number;
  recommendationSummary: string;
  structuralSignalOnly: true;
  neverOverwriteCanonicalSourceContent: true;
};

export type LocalizationValidationReport = {
  validationReportId: string;
  validationTimestamp: string;
  decision: "pass" | "partial" | "fail";
  errors: string[];
  warnings: string[];
  durationMs: number;
  metadataVersion: string;
};

export type LocRunReport = {
  localizationRunReportId: string;
  runTimestamp: string;
  action:
    | "connect"
    | "localize_product"
    | "localize_service"
    | "localize_storefront"
    | "localize_brand"
    | "localize_marketing"
    | "localize_customer_experience"
    | "adapt_region"
    | "detect_gaps"
    | "recommend_localization"
    | "diagnostics";
  engineRecord: LocalizationEngineRecord;
  localizationRecords: LocalizationRecord[];
  recommendations: LocalizationRecommendation[];
  validation: LocalizationValidationReport;
  durationMs: number;
  metadataVersion: string;
};

export type LocHealthReport = {
  status: HealthStatus;
  healthScore: number;
  engineEnabled: boolean;
  lastOperationAt: string | null;
  lastValidationDecision: LocalizationValidationReport["decision"] | null;
  consecutiveFailures: number;
  recoveryAttempts: number;
  totalLocalizationRecords: number;
  gapCount: number;
  averageReadinessScore: number;
  notes: string[];
};

export type LocPerformanceStats = {
  totalOperations: number;
  successfulOperations: number;
  failedOperations: number;
  productLocalizations: number;
  serviceLocalizations: number;
  storefrontLocalizations: number;
  brandLocalizations: number;
  marketingLocalizations: number;
  experienceLocalizations: number;
  regionalAdaptations: number;
  gapsDetected: number;
  recommendationsGenerated: number;
  retryAttempts: number;
  averageOperationDurationMs: number;
  peakOperationDurationMs: number;
};

export type LocalizationEngineState = {
  engineVersion: LocalizationEngineVersion;
  missionId: "X4-03";
  status: EngineStatus;
  initializedAt: string;
  configuration: LocalizationEngineConfiguration;
  latestReport: LocRunReport | null;
  engineRecord: LocalizationEngineRecord | null;
  health: LocHealthReport;
  performance: LocPerformanceStats;
};

export type LocCockpitSnapshot = {
  engineStatus: EngineStatus;
  healthStatus: HealthStatus;
  operationalState: OperationalState | null;
  lastDecision: LocalizationValidationReport["decision"] | null;
  totalLocalizationRecords: number;
  gapCount: number;
  averageReadinessScore: number;
  frameworkRegistered: boolean;
  dependenciesConnected: number;
  recentLogs: string[];
};

export type LocLogEntry = {
  logId: string;
  timestamp: string;
  event: string;
  level: "debug" | "info" | "warn" | "error";
  details: string;
};

export type ConnectLocalizationEngineInput = Record<string, unknown>;

export type LocalizationInput = {
  companyReference?: string;
  targetCountry?: string;
  targetRegion?: string;
  localizationCategory?: LocalizationCategory;
  assetReference?: string;
  readinessHint?: number;
  gapHint?: number;
  validated?: boolean;
};

export type RunLocDiagnosticsInput = {
  companyReference?: string;
  targetCountry?: string;
};
